import React, { useEffect, useRef } from "react";
import { View, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ConversationDetail } from "@/components/chat/ConversationDetail";
import { useWebSocket } from "@/contexts/websocket.context";
import { useQueryClient } from "@tanstack/react-query";
import { CONVERSATION_KEY, CONVERSATION_LIST_KEY } from "@/constants/query-keys.constants";

export default function ConversationDetailScreen() {
  const { id, driverId } = useLocalSearchParams<{ id: string; driverId?: string }>();
  const router = useRouter();
  const { onAckReceived } = useWebSocket();
  const queryClient = useQueryClient();
  const conversationId = parseInt(id, 10);
  const hasRedirectedRef = useRef(false);

  const handleBack = () => {
    router.back();
  };

  // Listen for conversation creation on first message
  useEffect(() => {
    // Only set up listener for new conversations (id=0)
    if (conversationId !== 0 || !driverId) {
      return;
    }

    console.log('[Chat Screen] Setting up ack listener for new conversation with driver:', driverId);

    const unsubscribe = onAckReceived((ack) => {
      console.log('[Chat Screen] Received ack:', {
        success: ack.success,
        conversationId: ack.conversationId,
        clientId: ack.clientId,
        hasRedirected: hasRedirectedRef.current
      });

      // When we get an ack with a real conversation ID, redirect
      if (ack.success && ack.conversationId && ack.conversationId > 0 && !hasRedirectedRef.current) {
        console.log('[Chat Screen] ✅ Redirecting to conversation:', ack.conversationId);
        hasRedirectedRef.current = true;

        // Invalidate conversation queries to ensure fresh data
        queryClient.invalidateQueries({
          queryKey: [CONVERSATION_KEY, CONVERSATION_LIST_KEY],
        });
        queryClient.invalidateQueries({
          queryKey: [CONVERSATION_KEY, ack.conversationId],
        });
        queryClient.invalidateQueries({
          queryKey: [CONVERSATION_KEY, 'messages', ack.conversationId],
        });

        // Refetch conversation list to ensure the new conversation is in the cache
        queryClient.refetchQueries({
          queryKey: [CONVERSATION_KEY, CONVERSATION_LIST_KEY],
        }).then(() => {
          console.log('[Chat Screen] 🔄 Navigating to /chats/' + ack.conversationId);
          router.replace(`/chats/${ack.conversationId}`);
        });
      }
    });

    return () => {
      console.log('[Chat Screen] Cleaning up ack listener');
      unsubscribe();
    };
  }, [conversationId, driverId, onAckReceived, router, queryClient]);

  if (!id) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ConversationDetail
        conversationId={conversationId}
        driverId={driverId}
        onBack={handleBack}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
});
