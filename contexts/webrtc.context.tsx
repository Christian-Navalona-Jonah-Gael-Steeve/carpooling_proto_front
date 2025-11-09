import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { webRTCService } from "@/lib/ws/webrtc.service";
import { webSocketService } from "@/lib/ws/websocket.service";
import { useWebSocket } from "./websocket.context";
import { useAuth } from "./auth.context";
import { CallType, CallSignalType } from "@/lib/enums/call.enums";
import { CallSignal } from "@/lib/types/call.types";
import { IUser } from "@/lib/types/user.types";

interface IncomingCallData {
  callId: string;
  caller: IUser;
  callType: CallType;
}

interface ActiveCallData {
  callId: string;
  participant: IUser;
  callType: CallType;
  isInitiator: boolean;
}

interface WebRTCContextType {
  // Call states
  incomingCall: IncomingCallData | null;
  activeCall: ActiveCallData | null;

  // Call actions
  initiateCall: (recipient: IUser, callType: CallType) => Promise<void>;
  answerCall: () => void;
  rejectCall: () => void;
  clearActiveCall: () => void;
}

const WebRTCContext = createContext<WebRTCContextType | undefined>(undefined);

export const WebRTCProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const { isConnected } = useWebSocket();

  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(
    null
  );
  const [activeCall, setActiveCall] = useState<ActiveCallData | null>(null);

  // Generate unique call ID
  const generateCallId = useCallback(() => {
    return `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Initiate a call (caller)
  const initiateCall = useCallback(
    async (recipient: IUser, callType: CallType) => {
      if (!user) return;

      const callId = generateCallId();

      try {
        console.log("[WebRTC] Initiating call:", {
          callId,
          callType,
          recipient: recipient.uid
        });

        // Start the WebRTC call
        await webRTCService.startCall(callType, callId, user.uid, recipient.uid);

        // Send call request signal
        const callRequest: CallSignal = {
          type: CallSignalType.CALL_REQUEST,
          callerId: user.uid,
          recipientId: recipient.uid,
          callType,
          callId,
          callerFirstName: user.firstName,
          callerLastName: user.lastName,
        };
        webSocketService.sendCallSignal(callRequest);

        // Move to active call immediately (as initiator)
        setActiveCall({
          callId,
          participant: recipient,
          callType,
          isInitiator: true,
        });
      } catch (error) {
        console.error("[WebRTC] Failed to initiate call:", error);
        webRTCService.endCall();
        throw error;
      }
    },
    [user, generateCallId]
  );

  // Answer incoming call (callee)
  const answerCall = useCallback(() => {
    if (!incomingCall || !user) return;

    console.log("[WebRTC] Answering call:", incomingCall.callId);

    // Move to active call (as receiver)
    // The ActiveCallModal will handle the actual WebRTC setup and signaling
    setActiveCall({
      callId: incomingCall.callId,
      participant: incomingCall.caller,
      callType: incomingCall.callType,
      isInitiator: false,
    });

    setIncomingCall(null);
  }, [incomingCall, user]);

  // Reject incoming call
  const rejectCall = useCallback(() => {
    if (!incomingCall || !user) return;

    console.log("[WebRTC] Rejecting call:", incomingCall.callId);

    const rejectSignal: CallSignal = {
      type: CallSignalType.CALL_REJECTED,
      callerId: user.uid,
      recipientId: incomingCall.caller.uid,
      callType: incomingCall.callType,
      callId: incomingCall.callId,
    };
    webSocketService.sendCallSignal(rejectSignal);

    setIncomingCall(null);
    webRTCService.endCall();
  }, [incomingCall, user]);

  // Clear active call (called by ActiveCallModal when call ends)
  const clearActiveCall = useCallback(() => {
    console.log("[WebRTC] Clearing active call");
    setActiveCall(null);
  }, []);

  // Listen for incoming call requests
  useEffect(() => {
    if (!isConnected || !user) return;

    console.log("[WebRTC Context] Setting up call signal listener");

    const unsubscribe = webSocketService.subscribeToCallSignals(
      (signal: CallSignal) => {
        console.log("[WebRTC Context] Received signal:", signal.type, "callId:", signal.callId);

        // Only handle CALL_REQUEST at context level when there's no active call
        // All other signals are handled by ActiveCallModal
        if (signal.type === CallSignalType.CALL_REQUEST && !activeCall) {
          console.log("[WebRTC Context] Showing incoming call modal");

          if (!signal.callId) {
            console.warn("[WebRTC Context] CALL_REQUEST missing callId!");
          }

          setIncomingCall({
            callId: signal.callId || generateCallId(),
            caller: {
              uid: signal.callerId,
              email: "",
              firstName: signal.callerFirstName || "",
              lastName: signal.callerLastName || "",
              cinNumber: "",
            },
            callType: signal.callType,
          });
        } else if (signal.type === CallSignalType.CALL_CANCELLED) {
          // Handle call cancellation before answer
          console.log("[WebRTC Context] Call cancelled by caller");
          setIncomingCall(null);
        }
        // Note: All other signals will be handled by ActiveCallModal
      }
    );

    return () => {
      console.log("[WebRTC Context] Cleaning up call signal listener");
      unsubscribe();
    };
  }, [isConnected, user, generateCallId, activeCall]);

  const value: WebRTCContextType = {
    incomingCall,
    activeCall,
    initiateCall,
    answerCall,
    rejectCall,
    clearActiveCall,
  };

  return (
    <WebRTCContext.Provider value={value}>{children}</WebRTCContext.Provider>
  );
};

export const useWebRTC = () => {
  const context = useContext(WebRTCContext);
  if (!context) {
    throw new Error("useWebRTC must be used within a WebRTCProvider");
  }
  return context;
};
