import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { webSocketService } from "../lib/ws/websocket.service";
import {
  IPrivateMessagePayload,
  MessageAckPayload,
  MessageStatusPayload,
  ConversationUpdatePayload,
} from "../lib/types/chat.types";
import { useAuth } from "./auth.context";
import { ACCESS_TOKEN_KEY } from "../constants/store-keys.constants";
import { storeManager } from "../lib/utils/store-manager";

interface WebSocketContextType {
  isConnected: boolean;
  sendPrivateMessage: (message: IPrivateMessagePayload) => void;
  updateMessageStatus: (status: MessageStatusPayload) => void;
  onMessageReceived: (
    handler: (message: IPrivateMessagePayload) => void
  ) => () => void;
  onAckReceived: (handler: (ack: MessageAckPayload) => void) => () => void;
  onConversationUpdate: (
    handler: (update: ConversationUpdatePayload) => void
  ) => () => void;
  onStatusUpdate: (
    handler: (status: MessageStatusPayload) => void
  ) => () => void;
  onTripEvent: (
    handler: (event: any) => void
  ) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(
  undefined
);

interface WebSocketProviderProps {
  children: React.ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const handlersRef = useRef<{
    messageHandlers: Set<(message: IPrivateMessagePayload) => void>;
    ackHandlers: Set<(ack: MessageAckPayload) => void>;
    conversationHandlers: Set<(update: ConversationUpdatePayload) => void>;
    statusHandlers: Set<(status: MessageStatusPayload) => void>;
    tripHandlers: Set<(event: any) => void>;
  }>({
    messageHandlers: new Set(),
    ackHandlers: new Set(),
    conversationHandlers: new Set(),
    statusHandlers: new Set(),
    tripHandlers: new Set(),
  });

  // Connect to WebSocket when user is authenticated
  useEffect(() => {
    const connectWebSocket = async () => {
      if (isAuthenticated && user) {
        try {
          const accessToken = await storeManager.getItem(ACCESS_TOKEN_KEY);
          const wsUrl =
            process.env.EXPO_PUBLIC_API_URL?.replace("/api", "/ws") ||
            "http://192.168.88.13:8080/ws";

          console.log("[WebSocket Context] Connecting to:", wsUrl);

          await webSocketService.connect(
            wsUrl,
            user.uid,
            accessToken || undefined,
            {
              onConnected: () => {
                console.log("[WebSocket Context] Connected");
                setIsConnected(true);
              },
              onDisconnected: () => {
                console.log("[WebSocket Context] Disconnected");
                setIsConnected(false);
              },
              onError: (error) => {
                console.error("[WebSocket Context] Error:", error);
                setIsConnected(false);
              },
            }
          );

          // Subscribe to all channels
          webSocketService.subscribeToPrivateMessages(
            (message: IPrivateMessagePayload) => {
              handlersRef.current.messageHandlers.forEach((handler) =>
                handler(message)
              );
            }
          );

          webSocketService.subscribeToAck((ack: MessageAckPayload) => {
            handlersRef.current.ackHandlers.forEach((handler) => handler(ack));
          });

          webSocketService.subscribeToConversationUpdates(
            (update: ConversationUpdatePayload) => {
              handlersRef.current.conversationHandlers.forEach((handler) =>
                handler(update)
              );
            }
          );

          webSocketService.subscribeToStatusUpdates(
            (status: MessageStatusPayload) => {
              handlersRef.current.statusHandlers.forEach((handler) =>
                handler(status)
              );
            }
          );

          // Trip topic events (broadcast)
          webSocketService.subscribeToTripEvents((evt: any) => {
            handlersRef.current.tripHandlers.forEach((h) => h(evt));
          });
        } catch (error) {
          console.error("[WebSocket Context] Failed to connect:", error);
          setIsConnected(false);
        }
      }
    };

    connectWebSocket();

    // Cleanup on unmount or auth change
    return () => {
      if (webSocketService.isConnected()) {
        webSocketService.disconnect();
      }
    };
  }, [isAuthenticated, user]);

  // Send private message
  const sendPrivateMessage = useCallback(
    (message: IPrivateMessagePayload) => {
      if (!isConnected) {
        console.error("[WebSocket Context] Cannot send message: not connected");
        return;
      }
      webSocketService.sendPrivateMessage(message);
    },
    [isConnected]
  );

  // Update message status
  const updateMessageStatus = useCallback(
    (status: MessageStatusPayload) => {
      if (!isConnected) {
        console.error(
          "[WebSocket Context] Cannot update status: not connected"
        );
        return;
      }
      webSocketService.updateMessageStatus(status);
    },
    [isConnected]
  );

  // Register message handler
  const onMessageReceived = useCallback(
    (handler: (message: IPrivateMessagePayload) => void) => {
      handlersRef.current.messageHandlers.add(handler);
      return () => {
        handlersRef.current.messageHandlers.delete(handler);
      };
    },
    []
  );

  // Register ack handler
  const onAckReceived = useCallback(
    (handler: (ack: MessageAckPayload) => void) => {
      handlersRef.current.ackHandlers.add(handler);
      return () => {
        handlersRef.current.ackHandlers.delete(handler);
      };
    },
    []
  );

  // Register conversation update handler
  const onConversationUpdate = useCallback(
    (handler: (update: ConversationUpdatePayload) => void) => {
      handlersRef.current.conversationHandlers.add(handler);
      return () => {
        handlersRef.current.conversationHandlers.delete(handler);
      };
    },
    []
  );

  // Register status update handler
  const onStatusUpdate = useCallback(
    (handler: (status: MessageStatusPayload) => void) => {
      handlersRef.current.statusHandlers.add(handler);
      return () => {
        handlersRef.current.statusHandlers.delete(handler);
      };
    },
    []
  );

  // Register trip event handler
  const onTripEvent = useCallback((handler: (event: any) => void) => {
    handlersRef.current.tripHandlers.add(handler);
    return () => {
      handlersRef.current.tripHandlers.delete(handler);
    };
  }, []);

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        sendPrivateMessage,
        updateMessageStatus,
        onMessageReceived,
        onAckReceived,
        onConversationUpdate,
        onStatusUpdate,
        onTripEvent,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
};
