import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  MonitorSpeaker,
  Volume2,
  VolumeX,
  Settings,
  Maximize2,
  Minimize2,
  Clock,
  DollarSign,
} from "lucide-react";
import { webRTCService, CallSession } from "../lib/webrtc";
import { VideoCall } from "../lib/supabase_modules/mechanics";
import { formatDistanceToNow } from "date-fns";

interface VideoCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoCall: VideoCall;
  isInitiator: boolean;
  onCallEnd: (duration: number, totalCost: number) => void;
}

const VideoCallModal: React.FC<VideoCallModalProps> = ({
  isOpen,
  onClose,
  videoCall,
  isInitiator,
  onCallEnd,
}) => {
  const [callSession, setCallSession] = useState<CallSession | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "failed"
  >("connecting");

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const callStartTime = useRef<Date | null>(null);
  const durationInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen && videoCall) {
      initializeCall();
    }

    return () => {
      cleanup();
    };
  }, [isOpen, videoCall]);

  useEffect(() => {
    // Set up WebRTC event handlers
    webRTCService.onRemoteStream = handleRemoteStream;
    webRTCService.onCallConnected = handleCallConnected;
    webRTCService.onCallEnded = handleCallEnded;
    webRTCService.onCallError = handleCallError;

    return () => {
      // Clean up event handlers
      webRTCService.onRemoteStream = undefined;
      webRTCService.onCallConnected = undefined;
      webRTCService.onCallEnded = undefined;
      webRTCService.onCallError = undefined;
    };
  }, []);

  const initializeCall = async () => {
    try {
      const session = await webRTCService.initiateCall(
        videoCall.id,
        isInitiator,
        videoCall.call_type !== "voice",
        true
      );
      setCallSession(session);

      // Set local video stream
      if (localVideoRef.current && session.localStream) {
        localVideoRef.current.srcObject = session.localStream;
      }

      callStartTime.current = new Date();
      startDurationTimer();
    } catch (error) {
      console.error("Failed to initialize call:", error);
      setConnectionStatus("failed");
    }
  };

  const startDurationTimer = () => {
    durationInterval.current = setInterval(() => {
      if (callStartTime.current) {
        const duration = Math.floor(
          (Date.now() - callStartTime.current.getTime()) / 1000
        );
        setCallDuration(duration);

        // Calculate estimated cost
        const minutes = duration / 60;
        const cost = minutes * videoCall.call_rate_per_minute;
        setEstimatedCost(cost);
      }
    }, 1000);
  };

  const handleRemoteStream = (callId: string, stream: MediaStream) => {
    if (callId === videoCall.id && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = stream;
    }
  };

  const handleCallConnected = (callId: string) => {
    if (callId === videoCall.id) {
      setIsConnected(true);
      setConnectionStatus("connected");
    }
  };

  const handleCallEnded = (callId: string) => {
    if (callId === videoCall.id) {
      endCall();
    }
  };

  const handleCallError = (callId: string, error: Error) => {
    if (callId === videoCall.id) {
      console.error("Call error:", error);
      setConnectionStatus("failed");
    }
  };

  const toggleVideo = async () => {
    if (callSession) {
      const enabled = await webRTCService.toggleVideo(callSession.id);
      setIsVideoEnabled(enabled);
    }
  };

  const toggleAudio = async () => {
    if (callSession) {
      const enabled = await webRTCService.toggleAudio(callSession.id);
      setIsAudioEnabled(enabled);
    }
  };

  const toggleScreenShare = async () => {
    if (callSession) {
      if (isScreenSharing) {
        const stopped = await webRTCService.stopScreenShare(callSession.id);
        setIsScreenSharing(!stopped);
      } else {
        const started = await webRTCService.startScreenShare(callSession.id);
        setIsScreenSharing(started);
      }
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen && modalRef.current) {
      modalRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const endCall = () => {
    if (callSession) {
      webRTCService.endCall(callSession.id);
    }

    const finalDuration = callDuration;
    const finalCost = estimatedCost;

    cleanup();
    onCallEnd(finalDuration, finalCost);
    onClose();
  };

  const cleanup = () => {
    if (durationInterval.current) {
      clearInterval(durationInterval.current);
      durationInterval.current = null;
    }
    callStartTime.current = null;
    setCallSession(null);
    setIsConnected(false);
    setCallDuration(0);
    setEstimatedCost(0);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center"
        ref={modalRef}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className={`relative w-full h-full max-w-6xl max-h-4xl bg-gray-900 rounded-lg overflow-hidden ${
            isFullscreen ? "max-w-none max-h-none rounded-none" : ""
          }`}
        >
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/50 to-transparent p-4">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      connectionStatus === "connected"
                        ? "bg-green-500"
                        : connectionStatus === "connecting"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                  />
                  <span className="text-sm">
                    {connectionStatus === "connected"
                      ? "Connected"
                      : connectionStatus === "connecting"
                      ? "Connecting..."
                      : "Connection Failed"}
                  </span>
                </div>
                {isConnected && (
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatDuration(callDuration)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <DollarSign className="w-4 h-4" />
                      <span>${estimatedCost.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={toggleFullscreen}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                {isFullscreen ? (
                  <Minimize2 className="w-5 h-5" />
                ) : (
                  <Maximize2 className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Video Container */}
          <div className="relative w-full h-full">
            {/* Remote Video (Main) */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />

            {/* Local Video (Picture-in-Picture) */}
            <div className="absolute top-20 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-white/20">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>

            {/* Connection Status Overlay */}
            {connectionStatus !== "connected" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-center text-white">
                  {connectionStatus === "connecting" && (
                    <>
                      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
                      <p className="text-xl">Connecting to call...</p>
                    </>
                  )}
                  {connectionStatus === "failed" && (
                    <>
                      <div className="text-red-500 mb-4">
                        <Phone className="w-16 h-16 mx-auto" />
                      </div>
                      <p className="text-xl">Connection failed</p>
                      <button
                        onClick={endCall}
                        className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        Close
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={toggleAudio}
                className={`p-4 rounded-full transition-colors ${
                  isAudioEnabled
                    ? "bg-gray-700 hover:bg-gray-600"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {isAudioEnabled ? (
                  <Mic className="w-6 h-6 text-white" />
                ) : (
                  <MicOff className="w-6 h-6 text-white" />
                )}
              </button>

              {videoCall.call_type !== "voice" && (
                <button
                  onClick={toggleVideo}
                  className={`p-4 rounded-full transition-colors ${
                    isVideoEnabled
                      ? "bg-gray-700 hover:bg-gray-600"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {isVideoEnabled ? (
                    <Video className="w-6 h-6 text-white" />
                  ) : (
                    <VideoOff className="w-6 h-6 text-white" />
                  )}
                </button>
              )}

              <button
                onClick={toggleScreenShare}
                className={`p-4 rounded-full transition-colors ${
                  isScreenSharing
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-gray-700 hover:bg-gray-600"
                }`}
              >
                {isScreenSharing ? (
                  <MonitorSpeaker className="w-6 h-6 text-white" />
                ) : (
                  <Monitor className="w-6 h-6 text-white" />
                )}
              </button>

              <button
                onClick={endCall}
                className="p-4 bg-red-600 hover:bg-red-700 rounded-full transition-colors"
              >
                <PhoneOff className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VideoCallModal;
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  MonitorSpeaker,
  Volume2,
  VolumeX,
  Settings,
  Maximize2,
  Minimize2,
  Clock,
  DollarSign,
} from "lucide-react";
import { webRTCService, CallSession } from "../lib/webrtc";
import { VideoCall } from "../lib/supabase_modules/mechanics";
import { formatDistanceToNow } from "date-fns";

interface VideoCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoCall: VideoCall;
  isInitiator: boolean;
  onCallEnd: (duration: number, totalCost: number) => void;
}

const VideoCallModal: React.FC<VideoCallModalProps> = ({
  isOpen,
  onClose,
  videoCall,
  isInitiator,
  onCallEnd,
}) => {
  const [callSession, setCallSession] = useState<CallSession | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "failed"
  >("connecting");

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const callStartTime = useRef<Date | null>(null);
  const durationInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen && videoCall) {
      initializeCall();
    }

    return () => {
      cleanup();
    };
  }, [isOpen, videoCall]);

  useEffect(() => {
    // Set up WebRTC event handlers
    webRTCService.onRemoteStream = handleRemoteStream;
    webRTCService.onCallConnected = handleCallConnected;
    webRTCService.onCallEnded = handleCallEnded;
    webRTCService.onCallError = handleCallError;

    return () => {
      // Clean up event handlers
      webRTCService.onRemoteStream = undefined;
      webRTCService.onCallConnected = undefined;
      webRTCService.onCallEnded = undefined;
      webRTCService.onCallError = undefined;
    };
  }, []);

  const initializeCall = async () => {
    try {
      const session = await webRTCService.initiateCall(
        videoCall.id,
        isInitiator,
        videoCall.call_type !== "voice",
        true
      );
      setCallSession(session);

      // Set local video stream
      if (localVideoRef.current && session.localStream) {
        localVideoRef.current.srcObject = session.localStream;
      }

      callStartTime.current = new Date();
      startDurationTimer();
    } catch (error) {
      console.error("Failed to initialize call:", error);
      setConnectionStatus("failed");
    }
  };

  const startDurationTimer = () => {
    durationInterval.current = setInterval(() => {
      if (callStartTime.current) {
        const duration = Math.floor(
          (Date.now() - callStartTime.current.getTime()) / 1000
        );
        setCallDuration(duration);

        // Calculate estimated cost
        const minutes = duration / 60;
        const cost = minutes * videoCall.call_rate_per_minute;
        setEstimatedCost(cost);
      }
    }, 1000);
  };

  const handleRemoteStream = (callId: string, stream: MediaStream) => {
    if (callId === videoCall.id && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = stream;
    }
  };

  const handleCallConnected = (callId: string) => {
    if (callId === videoCall.id) {
      setIsConnected(true);
      setConnectionStatus("connected");
    }
  };

  const handleCallEnded = (callId: string) => {
    if (callId === videoCall.id) {
      endCall();
    }
  };

  const handleCallError = (callId: string, error: Error) => {
    if (callId === videoCall.id) {
      console.error("Call error:", error);
      setConnectionStatus("failed");
    }
  };

  const toggleVideo = async () => {
    if (callSession) {
      const enabled = await webRTCService.toggleVideo(callSession.id);
      setIsVideoEnabled(enabled);
    }
  };

  const toggleAudio = async () => {
    if (callSession) {
      const enabled = await webRTCService.toggleAudio(callSession.id);
      setIsAudioEnabled(enabled);
    }
  };

  const toggleScreenShare = async () => {
    if (callSession) {
      if (isScreenSharing) {
        const stopped = await webRTCService.stopScreenShare(callSession.id);
        setIsScreenSharing(!stopped);
      } else {
        const started = await webRTCService.startScreenShare(callSession.id);
        setIsScreenSharing(started);
      }
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen && modalRef.current) {
      modalRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const endCall = () => {
    if (callSession) {
      webRTCService.endCall(callSession.id);
    }

    const finalDuration = callDuration;
    const finalCost = estimatedCost;

    cleanup();
    onCallEnd(finalDuration, finalCost);
    onClose();
  };

  const cleanup = () => {
    if (durationInterval.current) {
      clearInterval(durationInterval.current);
      durationInterval.current = null;
    }
    callStartTime.current = null;
    setCallSession(null);
    setIsConnected(false);
    setCallDuration(0);
    setEstimatedCost(0);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center"
        ref={modalRef}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className={`relative w-full h-full max-w-6xl max-h-4xl bg-gray-900 rounded-lg overflow-hidden ${
            isFullscreen ? "max-w-none max-h-none rounded-none" : ""
          }`}
        >
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/50 to-transparent p-4">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      connectionStatus === "connected"
                        ? "bg-green-500"
                        : connectionStatus === "connecting"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                  />
                  <span className="text-sm">
                    {connectionStatus === "connected"
                      ? "Connected"
                      : connectionStatus === "connecting"
                      ? "Connecting..."
                      : "Connection Failed"}
                  </span>
                </div>
                {isConnected && (
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatDuration(callDuration)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <DollarSign className="w-4 h-4" />
                      <span>${estimatedCost.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={toggleFullscreen}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                {isFullscreen ? (
                  <Minimize2 className="w-5 h-5" />
                ) : (
                  <Maximize2 className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Video Container */}
          <div className="relative w-full h-full">
            {/* Remote Video (Main) */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />

            {/* Local Video (Picture-in-Picture) */}
            <div className="absolute top-20 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-white/20">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>

            {/* Connection Status Overlay */}
            {connectionStatus !== "connected" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-center text-white">
                  {connectionStatus === "connecting" && (
                    <>
                      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
                      <p className="text-xl">Connecting to call...</p>
                    </>
                  )}
                  {connectionStatus === "failed" && (
                    <>
                      <div className="text-red-500 mb-4">
                        <Phone className="w-16 h-16 mx-auto" />
                      </div>
                      <p className="text-xl">Connection failed</p>
                      <button
                        onClick={endCall}
                        className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        Close
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={toggleAudio}
                className={`p-4 rounded-full transition-colors ${
                  isAudioEnabled
                    ? "bg-gray-700 hover:bg-gray-600"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {isAudioEnabled ? (
                  <Mic className="w-6 h-6 text-white" />
                ) : (
                  <MicOff className="w-6 h-6 text-white" />
                )}
              </button>

              {videoCall.call_type !== "voice" && (
                <button
                  onClick={toggleVideo}
                  className={`p-4 rounded-full transition-colors ${
                    isVideoEnabled
                      ? "bg-gray-700 hover:bg-gray-600"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {isVideoEnabled ? (
                    <Video className="w-6 h-6 text-white" />
                  ) : (
                    <VideoOff className="w-6 h-6 text-white" />
                  )}
                </button>
              )}

              <button
                onClick={toggleScreenShare}
                className={`p-4 rounded-full transition-colors ${
                  isScreenSharing
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-gray-700 hover:bg-gray-600"
                }`}
              >
                {isScreenSharing ? (
                  <MonitorSpeaker className="w-6 h-6 text-white" />
                ) : (
                  <Monitor className="w-6 h-6 text-white" />
                )}
              </button>

              <button
                onClick={endCall}
                className="p-4 bg-red-600 hover:bg-red-700 rounded-full transition-colors"
              >
                <PhoneOff className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VideoCallModal;
