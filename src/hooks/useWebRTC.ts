import { useState, useEffect, useCallback } from "react";
import { webRTCService, CallSession } from "@/lib/webrtc";

export interface UseWebRTCReturn {
  session: CallSession | null;
  isConnected: boolean;
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
  initiateCall: (callId: string, isInitiator: boolean) => Promise<void>;
  endCall: () => void;
  toggleVideo: () => Promise<boolean>;
  toggleAudio: () => Promise<boolean>;
  startScreenShare: () => Promise<boolean>;
  stopScreenShare: () => Promise<boolean>;
  handleSignalingData: (data: any) => Promise<void>;
  error: string | null;
}

export const useWebRTC = (): UseWebRTCReturn => {
  const [session, setSession] = useState<CallSession | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set up event handlers
  useEffect(() => {
    webRTCService.onRemoteStream = (callId: string, stream: MediaStream) => {
      const videoElement = document.getElementById(
        `remote-video-${callId}`
      ) as HTMLVideoElement;
      if (videoElement) {
        videoElement.srcObject = stream;
      }
    };

    webRTCService.onCallConnected = (callId: string) => {
      setIsConnected(true);
      setError(null);
    };

    webRTCService.onCallEnded = (callId: string) => {
      setSession(null);
      setIsConnected(false);
      setError(null);
    };

    webRTCService.onCallError = (callId: string, error: Error) => {
      setError(error.message);
      setIsConnected(false);
    };

    return () => {
      // Cleanup event handlers
      webRTCService.onRemoteStream = undefined;
      webRTCService.onCallConnected = undefined;
      webRTCService.onCallEnded = undefined;
      webRTCService.onCallError = undefined;
    };
  }, []);

  const initiateCall = useCallback(
    async (callId: string, isInitiator: boolean) => {
      try {
        setError(null);
        const newSession = await webRTCService.initiateCall(
          callId,
          isInitiator
        );
        setSession(newSession);

        // Set up local video stream
        const localVideoElement = document.getElementById(
          `local-video-${callId}`
        ) as HTMLVideoElement;
        if (localVideoElement && newSession.localStream) {
          localVideoElement.srcObject = newSession.localStream;
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to initiate call";
        setError(errorMessage);
      }
    },
    []
  );

  const endCall = useCallback(() => {
    if (session) {
      webRTCService.endCall(session.id);
      setSession(null);
      setIsConnected(false);
    }
  }, [session]);

  const toggleVideo = useCallback(async (): Promise<boolean> => {
    if (session) {
      return await webRTCService.toggleVideo(session.id);
    }
    return false;
  }, [session]);

  const toggleAudio = useCallback(async (): Promise<boolean> => {
    if (session) {
      return await webRTCService.toggleAudio(session.id);
    }
    return false;
  }, [session]);

  const startScreenShare = useCallback(async (): Promise<boolean> => {
    if (session) {
      return await webRTCService.startScreenShare(session.id);
    }
    return false;
  }, [session]);

  const stopScreenShare = useCallback(async (): Promise<boolean> => {
    if (session) {
      return await webRTCService.stopScreenShare(session.id);
    }
    return false;
  }, [session]);

  const handleSignalingData = useCallback(
    async (data: any) => {
      if (session) {
        await webRTCService.handleSignalingData(session.id, data);
      }
    },
    [session]
  );

  // Create refs for video elements
  const localVideoRef = { current: null } as React.RefObject<HTMLVideoElement>;
  const remoteVideoRef = { current: null } as React.RefObject<HTMLVideoElement>;

  return {
    session,
    isConnected,
    localVideoRef,
    remoteVideoRef,
    initiateCall,
    endCall,
    toggleVideo,
    toggleAudio,
    startScreenShare,
    stopScreenShare,
    handleSignalingData,
    error,
  };
};
