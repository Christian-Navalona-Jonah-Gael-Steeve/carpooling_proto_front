import { QueryClient } from "@tanstack/react-query";
import { IConversationMessage } from "@/lib/types/conversation.types";
import { CONVERSATION_KEY } from "@/constants/query-keys.constants";

/**
 * Helper functions for managing optimistic messages (pending/failed)
 * that need to persist across query refetches and WebSocket reconnections.
 */

/**
 * Extracts all optimistic messages (pending or failed) from the cache
 * and stores them in a ref for later restoration.
 *
 * @param queryClient - React Query client instance
 * @param conversationId - ID of the conversation to extract messages from
 * @param optimisticMessagesRef - Ref to store extracted messages
 */
export const extractOptimisticMessages = (
  queryClient: QueryClient,
  conversationId: number,
  optimisticMessagesRef: React.MutableRefObject<
    Map<number, IConversationMessage[]>
  >
) => {
  const cachedData = queryClient.getQueryData<{
    pages: IConversationMessage[][];
    pageParams: number[];
  }>([CONVERSATION_KEY, "messages", conversationId]);

  if (cachedData) {
    // Extract messages that are pending or failed (optimistic UI)
    const optimisticMsgs = cachedData.pages
      .flat()
      .filter((msg) => msg.isPending || msg.isFailed);

    if (optimisticMsgs.length > 0) {
      optimisticMessagesRef.current.set(conversationId, optimisticMsgs);
    } else {
      optimisticMessagesRef.current.delete(conversationId);
    }
  }
};

/**
 * Merges previously extracted optimistic messages back into the cache
 * after a refetch operation. Prevents duplicates and maintains message order.
 *
 * @param queryClient - React Query client instance
 * @param conversationId - ID of the conversation to merge messages into
 * @param optimisticMessagesRef - Ref containing stored optimistic messages
 */
export const mergeOptimisticMessages = (
  queryClient: QueryClient,
  conversationId: number,
  optimisticMessagesRef: React.MutableRefObject<
    Map<number, IConversationMessage[]>
  >
) => {
  const optimisticMsgs = optimisticMessagesRef.current.get(conversationId);

  if (!optimisticMsgs || optimisticMsgs.length === 0) return;

  queryClient.setQueryData<{
    pages: IConversationMessage[][];
    pageParams: number[];
  }>([CONVERSATION_KEY, "messages", conversationId], (old) => {
    if (!old) return old;

    // Get existing message IDs to avoid duplicates
    const existingIds = new Set(old.pages.flat().map((msg) => msg.id));

    // Filter out optimistic messages that already exist
    const newOptimisticMsgs = optimisticMsgs.filter(
      (msg) => !existingIds.has(msg.id)
    );

    if (newOptimisticMsgs.length === 0) return old;

    // Add optimistic messages to the first page
    const updatedPages = [...old.pages];
    updatedPages[0] = [...newOptimisticMsgs, ...updatedPages[0]];

    // Deduplicate all pages to ensure no duplicates
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
 * Removes a specific message from the optimistic messages ref.
 * Used when retrying a failed message to prevent it from being merged back.
 *
 * @param conversationId - ID of the conversation
 * @param messageId - ID of the message to remove
 * @param optimisticMessagesRef - Ref containing stored optimistic messages
 */
export const removeMessageFromOptimisticRef = (
  conversationId: number,
  messageId: number,
  optimisticMessagesRef: React.MutableRefObject<
    Map<number, IConversationMessage[]>
  >
) => {
  const optimisticMsgs = optimisticMessagesRef.current.get(conversationId);

  if (!optimisticMsgs) return;

  // Filter out the message with the specified ID
  const updatedMsgs = optimisticMsgs.filter((msg) => msg.id !== messageId);

  if (updatedMsgs.length === 0) {
    // No more optimistic messages, remove the conversation entry
    optimisticMessagesRef.current.delete(conversationId);
  } else {
    // Update with filtered messages
    optimisticMessagesRef.current.set(conversationId, updatedMsgs);
  }
};
