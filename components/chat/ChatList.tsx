import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Chat } from "../../lib/types/chat.types";
import { useChat } from "./ChatContext";
import ChatListItem from "./ChatListItem";

type Props = {
  chats: Chat[];
  onSelect: (chatId: string) => void;
};

export default function ChatList({ chats, onSelect }: Props) {
  const { state, loadChats } = useChat();
  const { isLoading, error } = state;

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading conversations...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#DC2626" />
        <Text style={styles.errorTitle}>Error loading conversations</Text>
        <Text style={styles.errorSubtitle}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadChats}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.chatsList} showsVerticalScrollIndicator={false}>
      {chats.length > 0 ? (
        chats.map((chat) => (
          <ChatListItem
            key={chat.id}
            chat={chat}
            onPress={() => onSelect(chat.id)}
          />
        ))
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubbles-outline" size={48} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptySubtitle}>
            Start a new conversation by booking a ride!
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chatsList: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: "Inter-Regular",
    color: "#6B7280",
    marginTop: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontFamily: "Inter-SemiBold",
    color: "#DC2626",
    marginTop: 16,
  },
  errorSubtitle: {
    fontSize: 16,
    fontFamily: "Inter-Regular",
    color: "#6B7280",
    textAlign: "center",
    marginTop: 8,
    marginHorizontal: 32,
  },
  retryButton: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
    color: "#FFFFFF",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Inter-SemiBold",
    color: "#374151",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: "Inter-Regular",
    color: "#6B7280",
    textAlign: "center",
    marginTop: 8,
  },
});
