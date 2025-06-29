import SimplePeer from "simple-peer";
import { supabase } from "./supabase";

export interface WebRTCConfig {
  iceServers: RTCIceServer[];
}

export interface CallSession {
  id: string;
  peer: SimplePeer.Instance;
  isInitiator: boolean;
  localStream?: MediaStream;
  remoteStream?: MediaStream;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isScreenSharing: boolean;
}

class WebRTCService {
  private sessions: Map<string, CallSession> = new Map();
  private config: WebRTCConfig;

  constructor() {
    this.config = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        // Add TURN servers for production
        ...(import.meta.env.VITE_WEBRTC_TURN_SERVER
          ? [
              {
                urls: import.meta.env.VITE_WEBRTC_TURN_SERVER,
                username: import.meta.env.VITE_WEBRTC_TURN_USERNAME,
                credential: import.meta.env.VITE_WEBRTC_TURN_CREDENTIAL,
              },
            ]
          : []),
      ],
    };
  }

  async initiateCall(
    callId: string,
    isInitiator: boolean,
    withVideo: boolean = true,
    withAudio: boolean = true
  ): Promise<CallSession> {
    try {
      // Get user media
      const localStream = await navigator.mediaDevices.getUserMedia({
        video: withVideo,
        audio: withAudio,
      });

      // Create peer connection
      const peer = new SimplePeer({
        initiator: isInitiator,
        trickle: false,
        config: this.config,
        stream: localStream,
      });

      // Create session
      const session: CallSession = {
        id: callId,
        peer,
        isInitiator,
        localStream,
        isVideoEnabled: withVideo,
        isAudioEnabled: withAudio,
        isScreenSharing: false,
      };

      this.sessions.set(callId, session);

      // Handle peer events
      this.setupPeerEvents(session);

      return session;
    } catch (error) {
      console.error("Failed to initiate call:", error);
      throw error;
    }
  }

  private setupPeerEvents(session: CallSession) {
    const { peer, id } = session;

    peer.on("signal", async (data) => {
      // Send signaling data through Supabase
      await this.sendSignalingData(id, data);
    });

    peer.on("stream", (stream) => {
      session.remoteStream = stream;
      this.onRemoteStream?.(id, stream);
    });

    peer.on("connect", () => {
      console.log("Peer connected");
      this.onCallConnected?.(id);
    });

    peer.on("close", () => {
      console.log("Peer connection closed");
      this.cleanup(id);
      this.onCallEnded?.(id);
    });

    peer.on("error", (error) => {
      console.error("Peer error:", error);
      this.onCallError?.(id, error);
    });
  }

  async handleSignalingData(callId: string, data: any) {
    const session = this.sessions.get(callId);
    if (session && !session.peer.destroyed) {
      session.peer.signal(data);
    }
  }

  async toggleVideo(callId: string): Promise<boolean> {
    const session = this.sessions.get(callId);
    if (!session?.localStream) return false;

    const videoTrack = session.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      session.isVideoEnabled = videoTrack.enabled;
      return videoTrack.enabled;
    }
    return false;
  }

  async toggleAudio(callId: string): Promise<boolean> {
    const session = this.sessions.get(callId);
    if (!session?.localStream) return false;

    const audioTrack = session.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      session.isAudioEnabled = audioTrack.enabled;
      return audioTrack.enabled;
    }
    return false;
  }

  async startScreenShare(callId: string): Promise<boolean> {
    const session = this.sessions.get(callId);
    if (!session) return false;

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      // Replace video track with screen share
      const videoTrack = screenStream.getVideoTracks()[0];
      const sender = session.peer._pc
        .getSenders()
        .find((s) => s.track && s.track.kind === "video");

      if (sender) {
        await sender.replaceTrack(videoTrack);
      }

      session.isScreenSharing = true;

      // Handle screen share end
      videoTrack.onended = () => {
        this.stopScreenShare(callId);
      };

      return true;
    } catch (error) {
      console.error("Failed to start screen share:", error);
      return false;
    }
  }

  async stopScreenShare(callId: string): Promise<boolean> {
    const session = this.sessions.get(callId);
    if (!session?.localStream) return false;

    try {
      // Get original video track
      const videoTrack = session.localStream.getVideoTracks()[0];
      const sender = session.peer._pc
        .getSenders()
        .find((s) => s.track && s.track.kind === "video");

      if (sender && videoTrack) {
        await sender.replaceTrack(videoTrack);
      }

      session.isScreenSharing = false;
      return true;
    } catch (error) {
      console.error("Failed to stop screen share:", error);
      return false;
    }
  }

  async endCall(callId: string) {
    const session = this.sessions.get(callId);
    if (session) {
      session.peer.destroy();
      this.cleanup(callId);
    }
  }

  private cleanup(callId: string) {
    const session = this.sessions.get(callId);
    if (session) {
      // Stop all tracks
      session.localStream?.getTracks().forEach((track) => track.stop());
      session.remoteStream?.getTracks().forEach((track) => track.stop());

      // Remove session
      this.sessions.delete(callId);
    }
  }

  private async sendSignalingData(callId: string, data: any) {
    const { error } = await supabase
      .from("video_calls")
      .update({
        [data.type === "offer" ? "offer" : "answer"]: JSON.stringify(data),
      })
      .eq("id", callId);

    if (error) {
      console.error("Failed to send signaling data:", error);
    }
  }

  // Event handlers - to be set by components
  onRemoteStream?: (callId: string, stream: MediaStream) => void;
  onCallConnected?: (callId: string) => void;
  onCallEnded?: (callId: string) => void;
  onCallError?: (callId: string, error: Error) => void;

  getSession(callId: string): CallSession | undefined {
    return this.sessions.get(callId);
  }

  getAllSessions(): CallSession[] {
    return Array.from(this.sessions.values());
  }
}

export const webRTCService = new WebRTCService();
import SimplePeer from "simple-peer";
import { supabase } from "./supabase";

export interface WebRTCConfig {
  iceServers: RTCIceServer[];
}

export interface CallSession {
  id: string;
  peer: SimplePeer.Instance;
  isInitiator: boolean;
  localStream?: MediaStream;
  remoteStream?: MediaStream;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isScreenSharing: boolean;
}

class WebRTCService {
  private sessions: Map<string, CallSession> = new Map();
  private config: WebRTCConfig;

  constructor() {
    this.config = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        // Add TURN servers for production
        ...(import.meta.env.VITE_WEBRTC_TURN_SERVER
          ? [
              {
                urls: import.meta.env.VITE_WEBRTC_TURN_SERVER,
                username: import.meta.env.VITE_WEBRTC_TURN_USERNAME,
                credential: import.meta.env.VITE_WEBRTC_TURN_CREDENTIAL,
              },
            ]
          : []),
      ],
    };
  }

  async initiateCall(
    callId: string,
    isInitiator: boolean,
    withVideo: boolean = true,
    withAudio: boolean = true
  ): Promise<CallSession> {
    try {
      // Get user media
      const localStream = await navigator.mediaDevices.getUserMedia({
        video: withVideo,
        audio: withAudio,
      });

      // Create peer connection
      const peer = new SimplePeer({
        initiator: isInitiator,
        trickle: false,
        config: this.config,
        stream: localStream,
      });

      // Create session
      const session: CallSession = {
        id: callId,
        peer,
        isInitiator,
        localStream,
        isVideoEnabled: withVideo,
        isAudioEnabled: withAudio,
        isScreenSharing: false,
      };

      this.sessions.set(callId, session);

      // Handle peer events
      this.setupPeerEvents(session);

      return session;
    } catch (error) {
      console.error("Failed to initiate call:", error);
      throw error;
    }
  }

  private setupPeerEvents(session: CallSession) {
    const { peer, id } = session;

    peer.on("signal", async (data) => {
      // Send signaling data through Supabase
      await this.sendSignalingData(id, data);
    });

    peer.on("stream", (stream) => {
      session.remoteStream = stream;
      this.onRemoteStream?.(id, stream);
    });

    peer.on("connect", () => {
      console.log("Peer connected");
      this.onCallConnected?.(id);
    });

    peer.on("close", () => {
      console.log("Peer connection closed");
      this.cleanup(id);
      this.onCallEnded?.(id);
    });

    peer.on("error", (error) => {
      console.error("Peer error:", error);
      this.onCallError?.(id, error);
    });
  }

  async handleSignalingData(callId: string, data: any) {
    const session = this.sessions.get(callId);
    if (session && !session.peer.destroyed) {
      session.peer.signal(data);
    }
  }

  async toggleVideo(callId: string): Promise<boolean> {
    const session = this.sessions.get(callId);
    if (!session?.localStream) return false;

    const videoTrack = session.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      session.isVideoEnabled = videoTrack.enabled;
      return videoTrack.enabled;
    }
    return false;
  }

  async toggleAudio(callId: string): Promise<boolean> {
    const session = this.sessions.get(callId);
    if (!session?.localStream) return false;

    const audioTrack = session.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      session.isAudioEnabled = audioTrack.enabled;
      return audioTrack.enabled;
    }
    return false;
  }

  async startScreenShare(callId: string): Promise<boolean> {
    const session = this.sessions.get(callId);
    if (!session) return false;

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      // Replace video track with screen share
      const videoTrack = screenStream.getVideoTracks()[0];
      const sender = session.peer._pc
        .getSenders()
        .find((s) => s.track && s.track.kind === "video");

      if (sender) {
        await sender.replaceTrack(videoTrack);
      }

      session.isScreenSharing = true;

      // Handle screen share end
      videoTrack.onended = () => {
        this.stopScreenShare(callId);
      };

      return true;
    } catch (error) {
      console.error("Failed to start screen share:", error);
      return false;
    }
  }

  async stopScreenShare(callId: string): Promise<boolean> {
    const session = this.sessions.get(callId);
    if (!session?.localStream) return false;

    try {
      // Get original video track
      const videoTrack = session.localStream.getVideoTracks()[0];
      const sender = session.peer._pc
        .getSenders()
        .find((s) => s.track && s.track.kind === "video");

      if (sender && videoTrack) {
        await sender.replaceTrack(videoTrack);
      }

      session.isScreenSharing = false;
      return true;
    } catch (error) {
      console.error("Failed to stop screen share:", error);
      return false;
    }
  }

  async endCall(callId: string) {
    const session = this.sessions.get(callId);
    if (session) {
      session.peer.destroy();
      this.cleanup(callId);
    }
  }

  private cleanup(callId: string) {
    const session = this.sessions.get(callId);
    if (session) {
      // Stop all tracks
      session.localStream?.getTracks().forEach((track) => track.stop());
      session.remoteStream?.getTracks().forEach((track) => track.stop());

      // Remove session
      this.sessions.delete(callId);
    }
  }

  private async sendSignalingData(callId: string, data: any) {
    const { error } = await supabase
      .from("video_calls")
      .update({
        [data.type === "offer" ? "offer" : "answer"]: JSON.stringify(data),
      })
      .eq("id", callId);

    if (error) {
      console.error("Failed to send signaling data:", error);
    }
  }

  // Event handlers - to be set by components
  onRemoteStream?: (callId: string, stream: MediaStream) => void;
  onCallConnected?: (callId: string) => void;
  onCallEnded?: (callId: string) => void;
  onCallError?: (callId: string, error: Error) => void;

  getSession(callId: string): CallSession | undefined {
    return this.sessions.get(callId);
  }

  getAllSessions(): CallSession[] {
    return Array.from(this.sessions.values());
  }
}

export const webRTCService = new WebRTCService();
