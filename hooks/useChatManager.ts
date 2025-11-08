import { useEffect, useCallback, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWebSocket } from "@/contexts/websocket.context";
import { useAuth } from "@/contexts/auth.context";
import {
  IPrivateMessagePayload,
  MessageAckPayload,
  ConversationUpdatePayload,
  MessageStatusPayload,
} from "@/lib/types/chat.types";
import { MessageStatus } from "@/lib/enums/message.enum";
import {
  CONVERSATION_KEY,
  CONVERSATION_LIST_KEY,
} from "@/constants/query-keys.constants";
import { IConversationMessage } from "@/lib/types/conversation.types";
import { MESSAGE_TIMEOUT_MS } from '../constants/chat.constants'
import {
  extractOptimisticMessages,
  mergeOptimisticMessages,
  removeMessageFromOptimisticRef,
  addOptimisticMessage,
  markMessageAsNotPending,
  markMessageAsFailed,
  replaceFailedMessage,
  addRealMessage,
  updateMessageStatus as updateMessageStatusInCache,
  clearMessageTimeout,
  clearAllTimeouts,
  removePendingMessage,
  addPendingMessage,
  findPendingMessageByContent,
  generateClientId,
  generateOptimisticId,
} from "../helpers/chat-helpers";

/**
 * Chat Manager Hook
 *
 * @returns
 */
export const useChatManager = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const {
    isConnected,
    sendPrivateMessage,
    updateMessageStatus,
    onMessageReceived,
    onAckReceived,
    onConversationUpdate,
    onStatusUpdate,
  } = useWebSocket();

  const pendingMessagesRef = useRef<Map<string, IPrivateMessagePayload>>(
    new Map()
  );
  const [pendingMessages, setPendingMessages] = useState<
    IPrivateMessagePayload[]
  >([]);

  const messageTimeoutsRef = useRef<Map<string, number>>(new Map());

  const optimisticMessagesRef = useRef<Map<number, IConversationMessage[]>>(
    new Map()
  );

  /**
   * Handles message timeout
   */
  const handleMessageTimeout = useCallback(
    (clientId: string, conversationId?: number) => {
      console.log("[Chat Manager] Message timeout:", clientId);

      const pendingMsg = pendingMessagesRef.current.get(clientId);
      if (!pendingMsg || !conversationId) return;

      removePendingMessage(clientId, pendingMessagesRef, setPendingMessages);
      clearMessageTimeout(clientId, messageTimeoutsRef);

      markMessageAsFailed(queryClient, conversationId, pendingMsg.content);

      extractOptimisticMessages(
        queryClient,
        conversationId,
        optimisticMessagesRef
      );
    },
    [queryClient]
  );


  /**
   * Sends a new message with optimistic UI.
   *
   * @param recipientId
   * @param content
   * @param conversationId
   * @returns
   */
  const sendMessage = useCallback(
    (recipientId: string, content: string, conversationId?: number) => {
      if (!user) return;

      const clientId = generateClientId();
      const message: IPrivateMessagePayload = {
        clientId,
        conversationId,
        senderId: user.uid,
        recipientId,
        content,
        status: MessageStatus.SENT,
        sentAt: new Date().toISOString(),
      };

      addPendingMessage(message, pendingMessagesRef, setPendingMessages);

      if (conversationId) {
        addOptimisticMessage(queryClient, conversationId, content, user);
      }

      const timeoutId = setTimeout(() => {
        handleMessageTimeout(clientId, conversationId);
      }, MESSAGE_TIMEOUT_MS);
      messageTimeoutsRef.current.set(clientId, timeoutId);

      try {
        sendPrivateMessage(message);
        console.log("[Chat Manager] Message sent successfully:", clientId);
      } catch (error) {
        console.warn(
          "[Chat Manager] Send failed (message pending, will timeout in 30s if no reconnect):",
          error
        );
      }

      return clientId;
    },
    [user, sendPrivateMessage, queryClient, handleMessageTimeout]
  );

  /**
   * Marks a message as read
   */
  const markAsRead = useCallback(
    (messageId: number, conversationId: number) => {
      updateMessageStatus({
        messageId,
        conversationId,
        status: MessageStatus.READ,
        timestamp: new Date().toISOString(),
      });
    },
    [updateMessageStatus]
  );

  /**
   * Marks a message as delivered
   */
  const markAsDelivered = useCallback(
    (messageId: number, conversationId: number) => {
      updateMessageStatus({
        messageId,
        conversationId,
        status: MessageStatus.DELIVERED,
        timestamp: new Date().toISOString(),
      });
    },
    [updateMessageStatus]
  );

  /**
   * Retries sending a failed message.
   *
   * @param failedMessage
   * @returns
   */
  const retryMessage = useCallback(
    (failedMessage: IConversationMessage) => {
      if (!user || !failedMessage.conversationId) return;

      const conversation = queryClient.getQueryData<any>([
        CONVERSATION_KEY,
        failedMessage.conversationId,
      ]);
      const recipient = conversation?.participants?.find(
        (p: any) => p.uid !== user.uid
      );

      if (!recipient) {
        console.error("[Chat Manager] Could not find recipient for retry");
        return;
      }

      const newClientId = generateClientId();
      const message: IPrivateMessagePayload = {
        clientId: newClientId,
        conversationId: failedMessage.conversationId,
        senderId: user.uid,
        recipientId: recipient.uid,
        content: failedMessage.content,
        status: MessageStatus.SENT,
        sentAt: new Date().toISOString(),
      };

      addPendingMessage(message, pendingMessagesRef, setPendingMessages);

      console.log(
        "[Chat Manager] Retrying message:",
        failedMessage.id,
        "→",
        newClientId
      );

      const newOptimisticMessage: IConversationMessage = {
        id: generateOptimisticId(),
        conversationId: failedMessage.conversationId,
        sender: {
          uid: user.uid,
          email: user.email || "",
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          cinNumber: user.cinNumber || "",
        },
        content: failedMessage.content,
        sentAt: new Date().toISOString(),
        deliveredAt: undefined,
        readAt: undefined,
        status: MessageStatus.SENT,
        isPending: true,
        isFailed: false,
      };

      replaceFailedMessage(
        queryClient,
        failedMessage.conversationId,
        failedMessage.id,
        newOptimisticMessage
      );

      // Explicitly remove old failed message from optimistic ref to prevent merge-back
      removeMessageFromOptimisticRef(
        failedMessage.conversationId,
        failedMessage.id,
        optimisticMessagesRef
      );

      extractOptimisticMessages(
        queryClient,
        failedMessage.conversationId,
        optimisticMessagesRef
      );

      const timeoutId = setTimeout(() => {
        handleMessageTimeout(newClientId, failedMessage.conversationId);
      }, MESSAGE_TIMEOUT_MS);
      messageTimeoutsRef.current.set(newClientId, timeoutId);

      try {
        sendPrivateMessage(message);
        console.log("[Chat Manager] Retry sent successfully:", newClientId);
      } catch (error) {
        console.warn(
          "[Chat Manager] Retry send failed (pending, will timeout in 30s if no reconnect):",
          error
        );
      }

      return newClientId;
    },
    [user, sendPrivateMessage, queryClient, handleMessageTimeout]
  );


  /**
   * Handles message acknowledgment
   */
  useEffect(() => {
    const unsubscribe = onAckReceived((ack: MessageAckPayload) => {
      console.log("[Chat Manager] Received ack:", ack);

      clearMessageTimeout(ack.clientId, messageTimeoutsRef);

      const pendingMsg = pendingMessagesRef.current.get(ack.clientId);
      if (!pendingMsg) return;

      if (ack.success) {
        removePendingMessage(ack.clientId, pendingMessagesRef, setPendingMessages);

        if (ack.conversationId) {
          markMessageAsNotPending(
            queryClient,
            ack.conversationId,
            pendingMsg.content
          );
        }
      } else {
        console.error("[Chat Manager] Message failed:", ack.error);

        if (ack.conversationId) {
          markMessageAsFailed(
            queryClient,
            ack.conversationId,
            pendingMsg.content
          );
          extractOptimisticMessages(
            queryClient,
            ack.conversationId,
            optimisticMessagesRef
          );
        }

        removePendingMessage(ack.clientId, pendingMessagesRef, setPendingMessages);
      }
    });

    return unsubscribe;
  }, [onAckReceived, queryClient]);

  /**
   * Handles new messages received
   */
  useEffect(() => {
    const unsubscribe = onMessageReceived((message: IPrivateMessagePayload) => {
      console.log("[Chat Manager] Received message:", message);

      if (!message.conversationId) return;

      if (message.senderId === user?.uid) {
        const matchingPending = findPendingMessageByContent(
          message.content,
          message.conversationId,
          pendingMessagesRef
        );

        if (matchingPending) {
          const [clientId] = matchingPending;
          console.log(
            "[Chat Manager] Clearing pending:",
            clientId,
            "→ real:",
            message.id
          );

          clearMessageTimeout(clientId, messageTimeoutsRef);
          removePendingMessage(clientId, pendingMessagesRef, setPendingMessages);
        }
      }

      addRealMessage(queryClient, message);

      if (message.senderId === user?.uid) {
        extractOptimisticMessages(
          queryClient,
          message.conversationId,
          optimisticMessagesRef
        );
      }

      if (message.recipientId === user?.uid && message.id) {
        markAsDelivered(message.id, message.conversationId);
      }
    });

    return unsubscribe;
  }, [onMessageReceived, queryClient, user, markAsDelivered]);

  /**
   * Handles conversation updates
   */
  useEffect(() => {
    const unsubscribe = onConversationUpdate(
      (update: ConversationUpdatePayload) => {
        console.log("[Chat Manager] Conversation update:", update);
        queryClient.invalidateQueries({
          queryKey: [CONVERSATION_KEY, CONVERSATION_LIST_KEY],
        });
      }
    );

    return unsubscribe;
  }, [onConversationUpdate, queryClient]);


  /**
   * Handles message status updates
   */
  useEffect(() => {
    const unsubscribe = onStatusUpdate((statusUpdate: MessageStatusPayload) => {
      console.log("[Chat Manager] Status update:", statusUpdate);
      updateMessageStatusInCache(queryClient, statusUpdate);
    });

    return unsubscribe;
  }, [onStatusUpdate, queryClient]);


  /**
   * Cleans up all timeouts on unmount
   */
  useEffect(() => {
    return () => {
      clearAllTimeouts(messageTimeoutsRef);
    };
  }, []);


  /**
   * Subscribes to query cache events
   */
  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (
        event.type === "updated" &&
        event.action.type === "fetch" &&
        event.query.queryKey[0] === CONVERSATION_KEY &&
        event.query.queryKey[1] === "messages"
      ) {
        const conversationId = event.query.queryKey[2] as number;
        extractOptimisticMessages(
          queryClient,
          conversationId,
          optimisticMessagesRef
        );
      }

      if (
        event.type === "updated" &&
        event.action.type === "success" &&
        event.query.queryKey[0] === CONVERSATION_KEY &&
        event.query.queryKey[1] === "messages"
      ) {
        const conversationId = event.query.queryKey[2] as number;
        setTimeout(() => {
          mergeOptimisticMessages(
            queryClient,
            conversationId,
            optimisticMessagesRef
          );
        }, 0);
      }
    });

    return unsubscribe;
  }, [queryClient]);


  return {
    isConnected,
    sendMessage,
    markAsRead,
    markAsDelivered,
    retryMessage,
    pendingMessages,
  };
};
