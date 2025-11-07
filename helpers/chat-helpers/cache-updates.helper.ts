import { QueryClient } from "@tanstack/react-query";
import { IConversationMessage } from "@/lib/types/conversation.types";
import {
  IPrivateMessagePayload,
  MessageStatusPayload,
} from "@/lib/types/chat.types";
import { CONVERSATION_KEY } from "@/constants/query-keys.constants";
import { MessageStatus } from "@/lib/enums/message.enum";
import { generateOptimisticId } from "./message-lifecycle.helper";

/**
 * Helper functions for updating the React Query cache with message changes.
 * These functions handle optimistic updates, message status changes, and cleanup.
 */

/**
 * Adds an optimistic message to the cache when a user sends a new message.
 * The message is shown immediately with pending status.
 *
 * @param queryClient - React Query client instance
 * @param conversationId - ID of the conversation
 * @param content - Message content
 * @param user - Current user object
 */
export const addOptimisticMessage = (
  queryClient: QueryClient,
  conversationId: number,
  content: string,
  user: { uid: string; email?: string; firstName?: string; lastName?: string; cinNumber?: string }
) => {
  queryClient.setQueryData<{
    pages: IConversationMessage[][];
    pageParams: number[];
  }>([CONVERSATION_KEY, "messages", conversationId], (old) => {
    if (!old) return old;

    const optimisticMessage: IConversationMessage = {
      id: generateOptimisticId(),
      conversationId,
      sender: {
        uid: user.uid,
        email: user.email || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        cinNumber: user.cinNumber || "",
      },
      content,
      sentAt: new Date().toISOString(),
      deliveredAt: undefined,
      readAt: undefined,
      status: MessageStatus.SENT,
      isPending: true,
      isFailed: false,
    };

    const updatedPages = [...old.pages];
    updatedPages[0] = [optimisticMessage, ...updatedPages[0]];

    return { ...old, pages: updatedPages };
  });
};

/**
 * Marks an optimistic message as no longer pending (success case).
 * Called when acknowledgment is received from the server.
 *
 * @param queryClient - React Query client instance
 * @param conversationId - ID of the conversation
 * @param messageContent - Content of the message to update
 */
export const markMessageAsNotPending = (
  queryClient: QueryClient,
  conversationId: number,
  messageContent: string
) => {
  queryClient.setQueryData<{
    pages: IConversationMessage[][];
    pageParams: number[];
  }>([CONVERSATION_KEY, "messages", conversationId], (old) => {
    if (!old) return old;

    const updatedPages = old.pages.map((page) => {
      return page.map((msg) => {
        if (msg.id < 0 && msg.content === messageContent) {
          return { ...msg, isPending: false };
        }
        return msg;
      });
    });

    return { ...old, pages: updatedPages };
  });
};

/**
 * Marks an optimistic message as failed.
 * Called when acknowledgment indicates failure or timeout occurs.
 *
 * @param queryClient - React Query client instance
 * @param conversationId - ID of the conversation
 * @param messageContent - Content of the message to mark as failed
 */
export const markMessageAsFailed = (
  queryClient: QueryClient,
  conversationId: number,
  messageContent: string
) => {
  queryClient.setQueryData<{
    pages: IConversationMessage[][];
    pageParams: number[];
  }>([CONVERSATION_KEY, "messages", conversationId], (old) => {
    if (!old) return old;

    const updatedPages = old.pages.map((page) => {
      return page.map((msg) => {
        if (msg.id < 0 && msg.content === messageContent) {
          return { ...msg, isPending: false, isFailed: true };
        }
        return msg;
      });
    });

    return { ...old, pages: updatedPages };
  });
};

/**
 * Removes an optimistic message and adds a new one atomically.
 * Used when retrying a failed message to prevent duplicates.
 *
 * @param queryClient - React Query client instance
 * @param conversationId - ID of the conversation
 * @param oldMessageId - ID of the failed message to remove
 * @param newMessage - New optimistic message to add
 */
export const replaceFailedMessage = (
  queryClient: QueryClient,
  conversationId: number,
  oldMessageId: number,
  newMessage: IConversationMessage
) => {
  queryClient.setQueryData<{
    pages: IConversationMessage[][];
    pageParams: number[];
  }>([CONVERSATION_KEY, "messages", conversationId], (old) => {
    if (!old) return old;

    const updatedPages = old.pages.map((page, pageIndex) => {
      // Filter out the old failed message
      const filtered = page.filter((msg) => msg.id !== oldMessageId);

      // Add new pending message to first page only
      if (pageIndex === 0) {
        return [newMessage, ...filtered];
      }

      return filtered;
    });

    // Deduplicate to ensure no duplicates
    const seenIds = new Set<number>();
    const deduplicatedPages = updatedPages.map((page) => {
      return page.filter((msg) => {
        if (seenIds.has(msg.id)) {
          return false;
        }
        seenIds.add(msg.id);
        return true;
      });
    });

    return { ...old, pages: deduplicatedPages };
  });
};

/**
 * Adds a real message from the backend to the cache, replacing any
 * optimistic messages with the same content.
 *
 * @param queryClient - React Query client instance
 * @param message - Message received from backend
 */
export const addRealMessage = (
  queryClient: QueryClient,
  message: IPrivateMessagePayload
) => {
  if (!message.conversationId) return;

  queryClient.setQueryData<{
    pages: IConversationMessage[][];
    pageParams: number[];
  }>([CONVERSATION_KEY, "messages", message.conversationId], (old) => {
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
                email: "",
                firstName: "",
                lastName: "",
                cinNumber: "",
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

    // Check if message already exists (deduplicate)
    const messageExists = old.pages.some((page) =>
      page.some((msg) => msg.id === message.id)
    );

    if (messageExists) {
      console.log(
        "[Cache Helper] Message already exists, skipping:",
        message.id
      );
      return old;
    }

    // Create real message object
    const newMessage: IConversationMessage = {
      id: message.id!,
      conversationId: message.conversationId!,
      sender: {
        uid: message.senderId,
        email: "",
        firstName: "",
        lastName: "",
        cinNumber: "",
      },
      content: message.content,
      sentAt: message.sentAt!,
      deliveredAt: message.deliveredAt,
      readAt: message.readAt,
      status: message.status,
    };

    // Remove any optimistic messages with the same content and sender
    const updatedPages = old.pages.map((page) => {
      return page.filter((msg) => {
        // Keep all real messages (positive IDs)
        if (msg.id > 0) return true;
        // Remove optimistic messages that match the incoming message
        return !(
          msg.content === message.content &&
          msg.sender.uid === message.senderId
        );
      });
    });

    // Add the real message to the first page
    updatedPages[0] = [newMessage, ...updatedPages[0]];

    // Final deduplication pass to ensure no duplicates across pages
    const seenIds = new Set<number>();
    const deduplicatedPages = updatedPages.map((page) => {
      return page.filter((msg) => {
        if (seenIds.has(msg.id)) {
          console.log("[Cache Helper] Removing duplicate message:", msg.id);
          return false;
        }
        seenIds.add(msg.id);
        return true;
      });
    });

    return { ...old, pages: deduplicatedPages };
  });
};

/**
 * Updates the status of a message
 *
 * @param queryClient
 * @param statusUpdate
 */
export const updateMessageStatus = (
  queryClient: QueryClient,
  statusUpdate: MessageStatusPayload
) => {
  queryClient.setQueryData<{
    pages: IConversationMessage[][];
    pageParams: number[];
  }>([CONVERSATION_KEY, "messages", statusUpdate.conversationId], (old) => {
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
              statusUpdate.status === MessageStatus.READ
                ? statusUpdate.timestamp
                : msg.readAt,
          };
        }
        return msg;
      })
    );

    return { ...old, pages: updatedPages };
  });
};
