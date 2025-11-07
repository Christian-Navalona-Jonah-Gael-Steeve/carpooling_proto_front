import { IPrivateMessagePayload } from "@/lib/types/chat.types";

/**
 * Helper functions for managing message lifecycle:
 * - Pending message tracking
 * - Timeout management
 * - Message cleanup
 */

/**
 * Clears a message timeout and removes it from the timeout ref.
 * Should be called when a message is acknowledged or when cleaning up.
 *
 * @param clientId - Unique client ID of the message
 * @param messageTimeoutsRef - Ref storing timeout IDs
 */
export const clearMessageTimeout = (
  clientId: string,
  messageTimeoutsRef: React.MutableRefObject<Map<string, number>>
) => {
  const timeoutId = messageTimeoutsRef.current.get(clientId);
  if (timeoutId) {
    clearTimeout(timeoutId);
    messageTimeoutsRef.current.delete(clientId);
  }
};

/**
 * Clears all pending message timeouts.
 * Should be called on component unmount to prevent memory leaks.
 *
 * @param messageTimeoutsRef - Ref storing timeout IDs
 */
export const clearAllTimeouts = (
  messageTimeoutsRef: React.MutableRefObject<Map<string, number>>
) => {
  messageTimeoutsRef.current.forEach((timeoutId) => {
    clearTimeout(timeoutId);
  });
  messageTimeoutsRef.current.clear();
};

/**
 * Removes a message from the pending messages tracking.
 *
 * @param clientId - Unique client ID of the message
 * @param pendingMessagesRef - Ref storing pending messages
 * @param setPendingMessages - State setter for pending messages
 */
export const removePendingMessage = (
  clientId: string,
  pendingMessagesRef: React.MutableRefObject<
    Map<string, IPrivateMessagePayload>
  >,
  setPendingMessages: React.Dispatch<
    React.SetStateAction<IPrivateMessagePayload[]>
  >
) => {
  pendingMessagesRef.current.delete(clientId);
  setPendingMessages((prev) => prev.filter((m) => m.clientId !== clientId));
};

/**
 * Adds a message to pending messages tracking.
 *
 * @param message - Message to add to pending state
 * @param pendingMessagesRef - Ref storing pending messages
 * @param setPendingMessages - State setter for pending messages
 */
export const addPendingMessage = (
  message: IPrivateMessagePayload,
  pendingMessagesRef: React.MutableRefObject<
    Map<string, IPrivateMessagePayload>
  >,
  setPendingMessages: React.Dispatch<
    React.SetStateAction<IPrivateMessagePayload[]>
  >
) => {
  if (!message.clientId) return;

  pendingMessagesRef.current.set(message.clientId, message);
  setPendingMessages((prev) => [...prev, message]);
};

/**
 * Finds a pending message by matching content and conversation ID.
 * Useful for cleaning up pending messages when the real message arrives.
 *
 * @param content - Message content to match
 * @param conversationId - Conversation ID to match
 * @param pendingMessagesRef - Ref storing pending messages
 * @returns Tuple of [clientId, message] if found, undefined otherwise
 */
export const findPendingMessageByContent = (
  content: string,
  conversationId: number,
  pendingMessagesRef: React.MutableRefObject<
    Map<string, IPrivateMessagePayload>
  >
): [string, IPrivateMessagePayload] | undefined => {
  const pendingEntries = Array.from(pendingMessagesRef.current.entries());
  return pendingEntries.find(
    ([_, pendingMsg]) =>
      pendingMsg.content === content &&
      pendingMsg.conversationId === conversationId
  );
};

/**
 * Generates a unique client ID for a message.
 * Format: {timestamp}-{random string}
 *
 * @returns Unique client ID
 */
export const generateClientId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
