import { useEffect, useCallback, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from '@/contexts/websocket.context';
import { useAuth } from '@/contexts/auth.context';
import {
  IPrivateMessagePayload,
  MessageAckPayload,
  ConversationUpdatePayload,
  MessageStatusPayload,
} from '@/lib/types/chat.types';
import { MessageStatus } from '@/lib/enums/message.enum';
import { CONVERSATION_KEY, CONVERSATION_LIST_KEY } from '@/constants/query-keys.constants';
import { IConversationMessage } from '@/lib/types/conversation.types';

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

  // Local pending messages map (clientId -> message)
  const pendingMessagesRef = useRef<Map<string, IPrivateMessagePayload>>(new Map());
  const [pendingMessages, setPendingMessages] = useState<IPrivateMessagePayload[]>([]);

  // Send message
  const sendMessage = useCallback(
    (recipientId: string, content: string, conversationId?: number) => {
      if (!user) return;

      const clientId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const message: IPrivateMessagePayload = {
        clientId,
        conversationId,
        senderId: user.uid,
        recipientId,
        content,
        status: MessageStatus.SENT,
        sentAt: new Date().toISOString(),
      };

      // Add to pending messages
      pendingMessagesRef.current.set(clientId, message);
      setPendingMessages((prev) => [...prev, message]);

      // Optimistically add message to conversation cache
      if (conversationId) {
        queryClient.setQueryData<{ pages: IConversationMessage[][]; pageParams: number[] }>(
          [CONVERSATION_KEY, 'messages', conversationId],
          (old) => {
            if (!old) return old;

            const optimisticMessage: IConversationMessage = {
              id: -Date.now(), // Temporary negative ID
              conversationId,
              sender: {
                uid: user.uid,
                email: user.email || '',
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                cinNumber: user.cinNumber || '',
              },
              content,
              sentAt: new Date().toISOString(),
              deliveredAt: undefined,
              readAt: undefined,
              status: MessageStatus.SENT,
            };

            const updatedPages = [...old.pages];
            updatedPages[0] = [optimisticMessage, ...updatedPages[0]];

            return { ...old, pages: updatedPages };
          }
        );
      }

      // Send via WebSocket
      sendPrivateMessage(message);

      return clientId;
    },
    [user, sendPrivateMessage, queryClient]
  );

  // Mark message as read
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

  // Mark message as delivered
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

  // Handle acknowledgment
  useEffect(() => {
    const unsubscribe = onAckReceived((ack: MessageAckPayload) => {
      console.log('[Chat Manager] Received ack:', ack);

      if (ack.success) {
        const pendingMsg = pendingMessagesRef.current.get(ack.clientId);

        // Remove from pending
        pendingMessagesRef.current.delete(ack.clientId);
        setPendingMessages((prev) => prev.filter((m) => m.clientId !== ack.clientId));

        // Update conversation messages cache - remove optimistic message
        if (ack.conversationId && pendingMsg) {
          queryClient.setQueryData<{ pages: IConversationMessage[][]; pageParams: number[] }>(
            [CONVERSATION_KEY, 'messages', ack.conversationId],
            (old) => {
              if (!old) return old;

              // Remove the optimistic message (it will be replaced by the real one from WebSocket)
              const updatedPages = old.pages.map((page) => {
                return page.filter((msg) => {
                  // Remove messages with temporary IDs that match the pending message content
                  const isOptimistic = msg.id < 0 && msg.content === pendingMsg.content;
                  return !isOptimistic;
                });
              });

              return { ...old, pages: updatedPages };
            }
          );
        }
      } else {
        console.error('[Chat Manager] Message failed:', ack.error);
        // Keep in pending or show error to user
      }
    });

    return unsubscribe;
  }, [onAckReceived, queryClient]);

  // Handle new message received
  useEffect(() => {
    const unsubscribe = onMessageReceived((message: IPrivateMessagePayload) => {
      console.log('[Chat Manager] Received message:', message);

      if (!message.conversationId) return;

      // Add message to conversation messages cache (prepend to first page)
      queryClient.setQueryData<{ pages: IConversationMessage[][]; pageParams: number[] }>(
        [CONVERSATION_KEY, 'messages', message.conversationId],
        (old) => {
          if (!old) {
            // Create new cache entry
            return {
              pages: [
                [
                  {
                    id: message.id!,
                    conversationId: message.conversationId!,
                    sender: {
                      uid: message.senderId,
                      email: '',
                      firstName: '',
                      lastName: '',
                      cinNumber: '',
                    },
                    content: message.content,
                    sentAt: message.sentAt!,
                    deliveredAt: message.deliveredAt,
                    readAt: message.readAt,
                    status: message.status,
                  },
                ],
              ],
              pageParams: [0],
            };
          }

          // Check if message already exists in cache (deduplicate)
          const messageExists = old.pages.some((page) =>
            page.some((msg) => msg.id === message.id)
          );

          if (messageExists) {
            console.log('[Chat Manager] Message already exists, skipping:', message.id);
            return old;
          }

          // Prepend to first page
          const newMessage: IConversationMessage = {
            id: message.id!,
            conversationId: message.conversationId!,
            sender: {
              uid: message.senderId,
              email: '',
              firstName: '',
              lastName: '',
              cinNumber: '',
            },
            content: message.content,
            sentAt: message.sentAt!,
            deliveredAt: message.deliveredAt,
            readAt: message.readAt,
            status: message.status,
          };

          const updatedPages = [...old.pages];
          updatedPages[0] = [newMessage, ...updatedPages[0]];

          return { ...old, pages: updatedPages };
        }
      );

      // Auto-mark as delivered if we're the recipient
      if (message.recipientId === user?.uid && message.id) {
        markAsDelivered(message.id, message.conversationId);
      }
    });

    return unsubscribe;
  }, [onMessageReceived, queryClient, user, markAsDelivered]);

  // Handle conversation update
  useEffect(() => {
    const unsubscribe = onConversationUpdate((update: ConversationUpdatePayload) => {
      console.log('[Chat Manager] Conversation update:', update);

      // Invalidate conversations list to refresh
      queryClient.invalidateQueries({ queryKey: [CONVERSATION_KEY, CONVERSATION_LIST_KEY] });
    });

    return unsubscribe;
  }, [onConversationUpdate, queryClient]);

  // Handle status update
  useEffect(() => {
    const unsubscribe = onStatusUpdate((statusUpdate: MessageStatusPayload) => {
      console.log('[Chat Manager] Status update:', statusUpdate);

      // Update message status in conversation messages cache
      queryClient.setQueryData<{ pages: IConversationMessage[][]; pageParams: number[] }>(
        [CONVERSATION_KEY, 'messages', statusUpdate.conversationId],
        (old) => {
          if (!old) return old;

          const updatedPages = old.pages.map((page) =>
            page.map((msg) => {
              if (msg.id === statusUpdate.messageId) {
                return {
                  ...msg,
                  status: statusUpdate.status,
                  deliveredAt:
                    statusUpdate.status === MessageStatus.DELIVERED
                      ? statusUpdate.timestamp
                      : msg.deliveredAt,
                  readAt:
                    statusUpdate.status === MessageStatus.READ ? statusUpdate.timestamp : msg.readAt,
                };
              }
              return msg;
            })
          );

          return { ...old, pages: updatedPages };
        }
      );
    });

    return unsubscribe;
  }, [onStatusUpdate, queryClient]);

  return {
    isConnected,
    sendMessage,
    markAsRead,
    markAsDelivered,
    pendingMessages,
  };
};
