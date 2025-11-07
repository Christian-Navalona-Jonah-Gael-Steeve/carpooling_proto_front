# Chat Helpers

This directory contains modular helper functions for managing chat functionality in the application.

## Structure

```
chat-helpers/
├── optimistic-messages.helper.ts  # Manage optimistic UI state
├── cache-updates.helper.ts        # React Query cache operations
├── message-lifecycle.helper.ts    # Message state & timeout management
├── constants.ts                   # Shared constants
├── index.ts                       # Barrel export
└── README.md                      # This file
```

## Files Overview

### `optimistic-messages.helper.ts`

Manages optimistic messages (pending/failed) that need to persist across query refetches.

**Functions:**
- `extractOptimisticMessages()` - Saves optimistic messages before refetch
- `mergeOptimisticMessages()` - Restores optimistic messages after refetch

**Use case:** Preserving pending/failed messages when WebSocket reconnects

---

### `cache-updates.helper.ts`

Handles all React Query cache updates for messages.

**Functions:**
- `addOptimisticMessage()` - Add message with pending state
- `markMessageAsNotPending()` - Clear pending state on success
- `markMessageAsFailed()` - Mark message as failed
- `replaceFailedMessage()` - Atomic replace for retry
- `addRealMessage()` - Add backend message, remove optimistic
- `updateMessageStatus()` - Update message status (SENT → DELIVERED → READ)

**Use case:** All cache mutations for message state changes

---

### `message-lifecycle.helper.ts`

Manages message lifecycle including pending state and timeouts.

**Functions:**
- `generateClientId()` - Create unique message IDs
- `addPendingMessage()` - Add to pending tracking
- `removePendingMessage()` - Remove from pending tracking
- `findPendingMessageByContent()` - Find pending by content
- `clearMessageTimeout()` - Clear single timeout
- `clearAllTimeouts()` - Clear all timeouts (cleanup)

**Use case:** Tracking pending messages and managing timeouts

---

### `constants.ts`

Shared constants used across chat helpers.

**Constants:**
- `MESSAGE_TIMEOUT_MS` - 30 second timeout for pending messages

---

## Usage Example

```typescript
import { useChatManager } from '@/hooks/useChatManager';

function ChatComponent() {
  const {
    sendMessage,
    retryMessage,
    isConnected,
    pendingMessages
  } = useChatManager();

  const handleSend = (content: string) => {
    sendMessage(recipientId, content, conversationId);
  };

  const handleRetry = (failedMessage) => {
    retryMessage(failedMessage);
  };

  return (
    // Your UI
  );
}
```

## Architecture

### Message Flow

```
1. User sends message
   ↓
2. addOptimisticMessage() - Shows immediately with spinner
   ↓
3. sendPrivateMessage() - Send via WebSocket
   ↓
4a. ACK success → markMessageAsNotPending()
4b. ACK failure → markMessageAsFailed()
4c. Timeout (30s) → markMessageAsFailed()
   ↓
5. Real message arrives → addRealMessage() removes optimistic
```

### Optimistic UI Persistence

```
1. WebSocket reconnects
   ↓
2. React Query refetches messages
   ↓
3. BEFORE fetch → extractOptimisticMessages()
   ↓
4. Fetch completes (fresh data)
   ↓
5. AFTER fetch → mergeOptimisticMessages()
   ↓
6. Pending/failed messages restored ✓
```

## Benefits of This Structure

✅ **Separation of Concerns** - Each helper has a single responsibility
✅ **Testability** - Pure functions are easy to unit test
✅ **Reusability** - Helpers can be used independently
✅ **Maintainability** - Easy to find and update specific functionality
✅ **Documentation** - JSDoc comments explain each function
✅ **Type Safety** - Full TypeScript support with explicit types

## Adding New Features

When adding new chat features:

1. Identify which helper category it belongs to
2. Add the function to the appropriate helper file
3. Export it from `index.ts`
4. Use it in `useChatManager.ts`
5. Update this README

## Troubleshooting

**Messages disappearing on reconnect?**
- Check `extractOptimisticMessages()` is called before refetch
- Verify `mergeOptimisticMessages()` is called after refetch

**Duplicate messages?**
- Ensure `addRealMessage()` filters optimistic messages
- Check `replaceFailedMessage()` for retry scenarios

**Memory leaks?**
- Verify `clearAllTimeouts()` is called on unmount
- Check timeout cleanup in acknowledgment handlers
