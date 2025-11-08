import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useAuth } from "@/contexts/auth.context";
import { useGetInfiniteConversations } from "@/hooks/queries/chat.queries";
import { useChatManager } from "@/hooks/useChatManager";
import { ConversationListItem } from "@/components/chat/ConversationListItem";
import { IConversation } from "@/lib/types/conversation.types";
import { Ionicons } from "@expo/vector-icons";

export default function ConversationListScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { isConnected } = useChatManager();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useGetInfiniteConversations();

  // Refetch data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  // Flatten paginated data
  const conversations = data?.pages.flat() || [];

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Handle load more
  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  // Handle conversation press
  const handleConversationPress = (conversation: IConversation) => {
    router.push({
      pathname: "/(tabs)/chats/[id]",
      params: { id: String(conversation.conversationId) },
    });
  };

  // Render conversation item
  const renderItem = ({ item }: { item: IConversation }) => (
    <ConversationListItem
      conversation={item}
      currentUserUid={user?.uid || ""}
      onPress={() => handleConversationPress(item)}
    />
  );

  // Render footer (loading indicator for pagination)
  const renderFooter = () => {
    if (!isFetchingNextPage) return null;

    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#2563EB" />
      </View>
    );
  };

  // Render empty state
  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.emptyText}>Chargement...</Text>
        </View>
      );
    }

    if (isError) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>Erreur</Text>
          <Text style={styles.emptyText}>
            Impossible de charger les conversations
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="chatbubbles-outline" size={64} color="#9CA3AF" />
        <Text style={styles.emptyTitle}>Aucune conversation</Text>
        <Text style={styles.emptyText}>
          Commencez une nouvelle conversation
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Discussions</Text>
        <View style={styles.headerRight}>
          {/* Connection status indicator */}
          <View
            style={[styles.statusDot, isConnected && styles.statusDotConnected]}
          />
        </View>
      </View>

      {/* Conversations list */}
      <FlatList
        data={conversations}
        renderItem={renderItem}
        keyExtractor={(item) => item.conversationId.toString()}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#2563EB"]}
            tintColor="#2563EB"
          />
        }
        contentContainerStyle={
          conversations.length === 0 ? styles.emptyList : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#DC2626",
  },
  statusDotConnected: {
    backgroundColor: "#10B981",
  },
  footer: {
    paddingVertical: 16,
    alignItems: "center",
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: "#2563EB",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
