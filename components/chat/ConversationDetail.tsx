import { DateSeparator } from "@/components/chat/DateSeparator";
import { MessageInput } from "@/components/chat/MessageInput";
import { MessageItem } from "@/components/chat/MessageItem";
import { useAuth } from "@/contexts/auth.context";
import {
  useGetConversation,
  useGetInfiniteConversationMessages,
} from "@/hooks/queries/chat.queries";
import { useChatManager } from "@/hooks/useChatManager";
import { IConversationMessage } from "@/lib/types/conversation.types";
import { isDifferentDay } from "@/lib/utils/date.utils";
import { getParticipantDisplayName } from "@/lib/utils/participant.utils";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ReviewSection } from "../reviews/ReviewSection";
import { useGetUserById } from "@/hooks/queries/user.queries";
import { IUser } from "@/lib/types/user.types";

interface ConversationDetailProps {
  conversationId: number;
  driverId?: string;
  onBack: () => void;
}

export const ConversationDetail: React.FC<ConversationDetailProps> = ({
  conversationId,
  driverId,
  onBack,
}) => {
  const { user } = useAuth();
  const { sendMessage, markAsRead, isConnected, retryMessage } =
    useChatManager();
  const flatListRef = useRef<FlatList>(null);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

  // Get conversation details (automatically disabled if conversationId is 0)
  const { data: conversation } = useGetConversation(conversationId);
  const { data: driver } = useGetUserById(driverId);

  // Get messages with infinite scroll (automatically disabled if conversationId is 0)
  const {
    data: messagesData,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetInfiniteConversationMessages(conversationId);

  // Deduplicate messages by ID and flatten pages
  const messages = React.useMemo(() => {
    if (!messagesData?.pages) return [];

    const allMessages = messagesData.pages.flat();
    const uniqueMessages = new Map<number, IConversationMessage>();

    // Keep only the first occurrence of each message ID
    allMessages.forEach((msg) => {
      if (!uniqueMessages.has(msg.id)) {
        uniqueMessages.set(msg.id, msg);
      }
    });

    return Array.from(uniqueMessages.values()).reverse();
  }, [messagesData?.pages]);

  // For new conversations (id=0), use driverId; otherwise get from conversation
  const otherParticipant = React.useMemo(() => {
    if (conversationId === 0 && driverId && driver) {
      // Return a minimal participant object for new conversations
      if(driver) return driver;
      return {
        uid: driverId,
        email: "",
        firstName: "",
        lastName: "",
      } as IUser
    }
    return conversation?.participants.find((p) => p.uid !== user?.uid);
  }, [conversationId, driver, driverId, conversation, user]);

  // Scroll to bottom on initial load and when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && !hasScrolledToBottom) {
      // Delay to ensure FlatList has rendered all items
      const scrollTimer = setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
        setHasScrolledToBottom(true);
      }, 300);

      return () => clearTimeout(scrollTimer);
    }
  }, [messages.length, hasScrolledToBottom]);

  // Reset scroll flag when conversation changes
  useEffect(() => {
    setHasScrolledToBottom(false);
  }, [conversationId]);

  // Mark messages as read when conversation opens
  useEffect(() => {
    if (conversationId && messages.length > 0) {
      const unreadMessages = messages.filter(
        (msg) => msg.sender.uid !== user?.uid && !msg.readAt
      );

      unreadMessages.forEach((msg) => {
        markAsRead(msg.id, conversationId);
      });
    }
  }, [conversationId, messages.length, user, markAsRead, messages]);

  const handleSend = (content: string) => {
    if (!otherParticipant) return;

    // For new conversations (id=0), pass undefined to let backend create it
    sendMessage(
      otherParticipant.uid,
      content,
      conversationId === 0 ? undefined : conversationId
    );

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const handleRetry = (message: IConversationMessage) => {
    retryMessage(message);

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const renderItem = ({
    item,
    index,
  }: {
    item: IConversationMessage;
    index: number;
  }) => {
    const isCurrentUser = item.sender.uid === user?.uid;
    const previousMessage = index > 0 ? messages[index - 1] : null;
    const showSender =
      !isCurrentUser &&
      (!previousMessage || previousMessage.sender.uid !== item.sender.uid);

    // Show date separator if this is the first message or if it's from a different day than the previous message
    const showDateSeparator =
      !previousMessage || isDifferentDay(previousMessage.sentAt, item.sentAt);

    return (
      <>
        {showDateSeparator && <DateSeparator dateString={item.sentAt} />}
        <MessageItem
          message={item}
          isCurrentUser={isCurrentUser}
          showSender={showSender}
          onRetry={handleRetry}
        />
      </>
    );
  };

  const renderHeader = () => {
    if (!isFetchingNextPage) return null;

    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color="#2563EB" />
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.emptyText}>Chargement des messages...</Text>
        </View>
      );
    }

    if (isError) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>Erreur</Text>
          <Text style={styles.emptyText}>
            Impossible de charger les messages
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="chatbubble-outline" size={64} color="#9CA3AF" />
        <Text style={styles.emptyTitle}>Aucun message</Text>
        <Text style={styles.emptyText}>Envoyez le premier message</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="chevron-back" size={28} color="#111827" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {getParticipantDisplayName(otherParticipant)}
          </Text>
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusDot,
                isConnected && styles.statusDotConnected,
              ]}
            />
            <Text style={styles.statusText}>
              {isConnected ? "En ligne" : "Hors ligne"}
            </Text>
          </View>
        </View>

        <View style={styles.callButtons}>
          <TouchableOpacity
            style={styles.callButton}
            onPress={() => {/* audio call action */}}
            accessibilityLabel={`Call ${getParticipantDisplayName(otherParticipant)}`}
            accessibilityRole="button"
          >
            <Ionicons name="call-outline" size={20} color="#2563EB" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.callButton}
            onPress={() => {/* video call action */}}
            accessibilityLabel={`Video call ${getParticipantDisplayName(otherParticipant)}`}
            accessibilityRole="button"
          >
            <Ionicons name="videocam-outline" size={20} color="#2563EB" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages list */}
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => `msg-${item.id}`}
          contentContainerStyle={
            messages.length === 0 ? styles.emptyList : styles.messagesList
          }
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          inverted={false}
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
            autoscrollToTopThreshold: 10,
          }}
        />

        
        {otherParticipant && (
          <ReviewSection
            driverId={otherParticipant.uid}
            driverName={otherParticipant.firstName + ' ' + otherParticipant.lastName}
            compact={true}
          />
        )}

        {/* Message input */}
        <MessageInput
          onSend={handleSend}
          disabled={!isConnected || !otherParticipant}
        />
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    gap: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#DC2626",
  },
  statusDotConnected: {
    backgroundColor: "#10B981",
  },
  statusText: {
    fontSize: 12,
    color: "#6B7280",
  },
  callButtons: {
    flexDirection: "row",
    gap: 16,
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  messagesList: {
    paddingVertical: 16,
    paddingBottom: 16,
  },
  emptyList: {
    flex: 1,
    justifyContent: "center",
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
  loadingMore: {
    paddingVertical: 16,
    alignItems: "center",
  },
});
