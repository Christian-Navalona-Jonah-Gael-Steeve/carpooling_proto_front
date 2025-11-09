import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useWebRTC } from "@/contexts/webrtc.context";
import { CallType, CallSignalType } from "@/lib/enums/call.enums";
import { getParticipantDisplayName } from "@/lib/utils/participant.utils";
import { RTCView, MediaStream } from "react-native-webrtc";
import { webRTCService } from "@/lib/ws/webrtc.service";
import { webSocketService } from "@/lib/ws/websocket.service";
import { CallSignal } from "@/lib/types/call.types";
import { useAuth } from "@/contexts/auth.context";

export const ActiveCallModal: React.FC = () => {
  const { user } = useAuth();
  const {
    activeCall,
    clearActiveCall,
  } = useWebRTC();

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isMicrophoneOn, setIsMicrophoneOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callStatus, setCallStatus] = useState<string>("Connecting...");

  const isCleaningUp = useRef(false);
  const hasAnswered = useRef(false);
  const cleanupFnRef = useRef<(() => void) | null>(null);

  // Reset state when activeCall changes
  useEffect(() => {
    if (activeCall) {
      console.log("[ActiveCall] New call detected, resetting state");
      hasAnswered.current = false;
      isCleaningUp.current = false;
      setLocalStream(null);
      setRemoteStream(null);
      setCallDuration(0);
      setIsMicrophoneOn(true);
      setIsCameraOn(true);
      setIsSpeakerOn(true);
      setCallStatus("Connexion...");
    }
  }, [activeCall?.callId]);

  // Call duration timer
  useEffect(() => {
    if (!activeCall) {
      setCallDuration(0);
      return;
    }

    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeCall]);

  // Initialize call when modal mounts
  useEffect(() => {
    if (!activeCall || !user) return;

    initializeCall();

    return () => {
      console.log("[ActiveCall] Component unmounting, cleaning up");
      if (cleanupFnRef.current) {
        cleanupFnRef.current();
        cleanupFnRef.current = null;
      }
      cleanup();
    };
  }, [activeCall?.callId, user]); // Re-initialize when callId or user changes

  const initializeCall = async () => {
    if (!activeCall || !user) return;

    console.log("[ActiveCall] Initializing call:", {
      callId: activeCall.callId,
      isInitiator: activeCall.isInitiator,
      participant: activeCall.participant.uid
    });

    try {
      // Check if there's already a local stream (for caller who already called startCall)
      const existingLocalStream = webRTCService.getLocalStream();
      if (existingLocalStream) {
        console.log("[ActiveCall] Found existing local stream, using it");
        setLocalStream(existingLocalStream);
      }

      // Check if there's already a remote stream
      const existingRemoteStream = webRTCService.getRemoteStream();
      if (existingRemoteStream) {
        console.log("[ActiveCall] Found existing remote stream, using it");
        setRemoteStream(existingRemoteStream);
        setCallStatus("Connecté");
      }

      // Set up WebRTC callbacks for future updates
      webRTCService.on("localStream", handleLocalStream);
      webRTCService.on("remoteStream", handleRemoteStream);
      webRTCService.on("signal", handleSignal);
      webRTCService.on("callEnded", handleCallEnded);

      // Subscribe to WebSocket call signals
      console.log("[ActiveCall] Subscribing to call signals for callId:", activeCall.callId);
      const unsubscribe = webSocketService.subscribeToCallSignals(handleIncomingSignal);

      if (activeCall.isInitiator) {
        // Outgoing call - wait for CALL_ACCEPTED to send offer
        setCallStatus("Appel en cours...");
        console.log("[ActiveCall] Initiator - waiting for CALL_ACCEPTED");
      } else {
        // Incoming call - auto-accept since user already accepted in IncomingCallModal
        if (!hasAnswered.current) {
          await acceptCall();
        }
      }

      // Store cleanup function
      cleanupFnRef.current = () => {
        console.log("[ActiveCall] Cleaning up subscriptions");
        unsubscribe();
        webRTCService.off("localStream", handleLocalStream);
        webRTCService.off("remoteStream", handleRemoteStream);
        webRTCService.off("signal", handleSignal);
        webRTCService.off("callEnded", handleCallEnded);
      };
    } catch (error) {
      console.error("[ActiveCall] Error initializing call:", error);
      endCall();
    }
  };

  const acceptCall = async () => {
    if (!activeCall || !user || hasAnswered.current) return;
    hasAnswered.current = true;

    try {
      setCallStatus("Acceptation de l'appel...");

      const stream = await webRTCService.answerCall(
        activeCall.callType,
        activeCall.callId,
        user.uid,
        activeCall.participant.uid
      );

      console.log("[ActiveCall] Call answered, peer connection initialized");

      // Send call accepted signal
      const acceptSignal: CallSignal = {
        type: CallSignalType.CALL_ACCEPTED,
        callerId: user.uid,
        recipientId: activeCall.participant.uid,
        callType: activeCall.callType,
        callId: activeCall.callId,
      };
      webSocketService.sendCallSignal(acceptSignal);
      setCallStatus("Connexion...");
    } catch (error) {
      console.error("[ActiveCall] Failed to accept call:", error);
      endCall();
    }
  };

  const handleLocalStream = (stream: MediaStream) => {
    console.log("[ActiveCall] Local stream received");
    setLocalStream(stream);
  };

  const handleRemoteStream = (stream: MediaStream) => {
    console.log("[ActiveCall] Remote stream received");
    setRemoteStream(stream);
    setCallStatus("Connecté");
  };

  const handleSignal = (signal: CallSignal) => {
    console.log("[ActiveCall] Sending signal:", signal.type);
    webSocketService.sendCallSignal(signal);
  };

  const handleCallEnded = () => {
    console.log("[ActiveCall] Call ended");
    cleanup();
    clearActiveCall();
  };

  const handleIncomingSignal = async (signal: CallSignal) => {
    if (!activeCall) {
      console.log("[ActiveCall] No active call, ignoring signal:", signal.type);
      return;
    }

    // Only process signals for this call
    if (signal.callId !== activeCall.callId) {
      console.log("[ActiveCall] Ignoring signal for different call. Expected:", activeCall.callId, "Got:", signal.callId, "Type:", signal.type);
      return;
    }

    console.log("[ActiveCall] Processing signal:", signal.type, "for callId:", signal.callId);

    try {
      switch (signal.type) {
        case CallSignalType.CALL_ACCEPTED:
          if (activeCall.isInitiator) {
            console.log("[ActiveCall] Call accepted, creating offer");
            setCallStatus("Appel accepté, connexion...");
            await webRTCService.createAndSendOffer();
          }
          break;

        case CallSignalType.CALL_REJECTED:
          console.log("[ActiveCall] Call rejected");
          endCall();
          break;

        case CallSignalType.CALL_ENDED:
        case CallSignalType.CALL_CANCELLED:
          console.log("[ActiveCall] Call ended/cancelled by remote");
          cleanup();
          clearActiveCall();
          break;

        case CallSignalType.OFFER:
          if (signal.offer && webRTCService.isPeerConnectionInitialized()) {
            console.log("[ActiveCall] Handling offer");
            await webRTCService.handleOffer(signal.offer);
          }
          break;

        case CallSignalType.ANSWER:
          if (signal.answer) {
            console.log("[ActiveCall] Handling answer");
            await webRTCService.handleAnswer(signal.answer);
            setCallStatus("Connecté");
          }
          break;

        case CallSignalType.ICE_CANDIDATE:
          if (signal.candidate) {
            await webRTCService.handleIceCandidate(signal.candidate);
          }
          break;
      }
    } catch (error) {
      console.error("[ActiveCall] Error handling signal:", error);
    }
  };

  const toggleMicrophone = () => {
    const enabled = webRTCService.toggleMicrophone();
    setIsMicrophoneOn(enabled);
  };

  const toggleCamera = () => {
    const enabled = webRTCService.toggleCamera();
    setIsCameraOn(enabled);
  };

  const toggleSpeaker = async () => {
    const enabled = await webRTCService.toggleSpeaker();
    setIsSpeakerOn(enabled);
  };

  const endCall = () => {
    if (!activeCall || !user) return;

    const endSignal: CallSignal = {
      type: CallSignalType.CALL_ENDED,
      callerId: user.uid,
      recipientId: activeCall.participant.uid,
      callType: activeCall.callType,
      callId: activeCall.callId,
    };
    webSocketService.sendCallSignal(endSignal);

    cleanup();
    clearActiveCall();
  };

  const cleanup = () => {
    if (isCleaningUp.current) {
      console.log("[ActiveCall] Already cleaning up, skipping");
      return;
    }
    isCleaningUp.current = true;

    console.log("[ActiveCall] Cleaning up call:", activeCall?.callId);

    // Clean up WebRTC service
    webRTCService.endCall();

    // Reset local state
    setLocalStream(null);
    setRemoteStream(null);
    hasAnswered.current = false;

    console.log("[ActiveCall] Cleanup complete");
    isCleaningUp.current = false;
  };

  if (!activeCall) return null;

  const isVideoCall = activeCall.callType === CallType.VIDEO;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Modal visible={true} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.container}>
        {/* Video Views */}
        {isVideoCall ? (
          <>
            {/* Remote video - fullscreen */}
            {remoteStream ? (
              <RTCView
                streamURL={remoteStream.toURL()}
                style={styles.remoteVideo}
                objectFit="cover"
              />
            ) : (
              <View style={styles.remoteVideoPlaceholder}>
                <Ionicons name="person" size={80} color="#6B7280" />
                <Text style={styles.waitingText}>
                  {callStatus === "Connecté" ? "En attente de la vidéo..." : callStatus}
                </Text>
              </View>
            )}

            {/* Local video - picture in picture */}
            {localStream && isCameraOn && (
              <View style={styles.localVideoContainer}>
                <RTCView
                  streamURL={localStream.toURL()}
                  style={styles.localVideo}
                  objectFit="cover"
                  mirror={true}
                />
              </View>
            )}
          </>
        ) : (
          // Audio call UI
          <View style={styles.audioCallContainer}>
            {/* Hidden RTCView for audio playback - required even for audio-only calls */}
            {remoteStream && (
              <RTCView
                streamURL={remoteStream.toURL()}
                style={styles.hiddenVideo}
                objectFit="cover"
                mirror={false}
              />
            )}
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={80} color="#FFFFFF" />
            </View>
            <Text style={styles.participantName}>
              {getParticipantDisplayName(activeCall.participant)}
            </Text>
            <Text style={styles.callStatus}>
              {callStatus}
            </Text>
          </View>
        )}

        {/* Call info overlay */}
        <View style={styles.infoOverlay}>
          <Text style={styles.participantNameOverlay}>
            {getParticipantDisplayName(activeCall.participant)}
          </Text>
          <Text style={styles.durationText}>{formatDuration(callDuration)}</Text>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          {/* Microphone toggle */}
          <TouchableOpacity
            style={[
              styles.controlButton,
              !isMicrophoneOn && styles.controlButtonDisabled,
            ]}
            onPress={toggleMicrophone}
          >
            <Ionicons
              name={isMicrophoneOn ? "mic" : "mic-off"}
              size={28}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          {/* Speaker toggle (audio call only) */}
          {!isVideoCall && (
            <TouchableOpacity
              style={[
                styles.controlButton,
                !isSpeakerOn && styles.controlButtonDisabled,
              ]}
              onPress={toggleSpeaker}
            >
              <Ionicons
                name={isSpeakerOn ? "volume-high" : "volume-mute"}
                size={28}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          )}

          {/* Camera toggle (video call only) */}
          {isVideoCall && (
            <TouchableOpacity
              style={[
                styles.controlButton,
                !isCameraOn && styles.controlButtonDisabled,
              ]}
              onPress={toggleCamera}
            >
              <Ionicons
                name={isCameraOn ? "videocam" : "videocam-off"}
                size={28}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          )}

          {/* End call */}
          <TouchableOpacity
            style={styles.endCallButton}
            onPress={endCall}
          >
            <Ionicons name="call" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1F2937",
  },
  // Video call styles
  remoteVideo: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  remoteVideoPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#374151",
  },
  waitingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#9CA3AF",
  },
  localVideoContainer: {
    position: "absolute",
    top: 60,
    right: 20,
    width: 120,
    height: 160,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  localVideo: {
    width: "100%",
    height: "100%",
  },
  // Audio call styles
  audioCallContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 150,
  },
  avatarCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#4B5563",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  participantName: {
    fontSize: 32,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  callStatus: {
    fontSize: 18,
    color: "#9CA3AF",
  },
  // Info overlay
  infoOverlay: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
  },
  participantNameOverlay: {
    fontSize: 24,
    fontWeight: "600",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  durationText: {
    fontSize: 16,
    color: "#E5E7EB",
    marginTop: 4,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  // Controls
  controls: {
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
    paddingHorizontal: 20,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#374151",
    justifyContent: "center",
    alignItems: "center",
  },
  controlButtonDisabled: {
    backgroundColor: "#DC2626",
  },
  endCallButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#DC2626",
    justifyContent: "center",
    alignItems: "center",
  },
  // Hidden video for audio playback
  hiddenVideo: {
    width: 1,
    height: 1,
    position: "absolute",
    top: -100,
    left: -100,
  },
});
