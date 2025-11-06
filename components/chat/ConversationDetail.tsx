import { MessageInput } from '@/components/chat/MessageInput';
import { MessageItem } from '@/components/chat/MessageItem';
import { ReviewSection } from '@/components/reviews/ReviewSection';
import { useAuth } from '@/contexts/auth.context';
import { useGetConversation, useGetInfiniteConversationMessages } from '@/hooks/queries/chat.queries';
import { useChatManager } from '@/hooks/useChatManager';
import { IConversationMessage } from '@/lib/types/conversation.types';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
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

interface ConversationDetailProps {
  conversationId: number;
  onBack: () => void;
}

export const ConversationDetail: React.FC<ConversationDetailProps> = ({
  conversationId,
  onBack,
}) => {
  const { user } = useAuth();
  const { sendMessage, markAsRead, isConnected } = useChatManager();
  const flatListRef = useRef<FlatList>(null);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

  // Get conversation details
  const { data: conversation } = useGetConversation(conversationId);

  // Get messages with infinite scroll
  const {
    data: messagesData,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetInfiniteConversationMessages(conversationId);

  // Flatten and reverse messages (newest first -> oldest first for chat display)
  const messages = messagesData?.pages.flat().reverse() || [];

  // Get other participant
  const otherParticipant = conversation?.participants.find((p) => p.uid !== user?.uid);

  // Scroll to bottom on initial load
  useEffect(() => {
    if (messages.length > 0 && !hasScrolledToBottom) {
      // Use requestAnimationFrame for better timing
      requestAnimationFrame(() => {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: false });
          setHasScrolledToBottom(true);
        }, 150);
      });
    }
  }, [messages.length, hasScrolledToBottom]);

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

  // Handle send message
  const handleSend = (content: string) => {
    if (!otherParticipant || !conversationId) return;

    sendMessage(otherParticipant.uid, content, conversationId);

    // Scroll to bottom after sending
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // Handle load more (older messages)
  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  // Render message item
  const renderItem = ({ item, index }: { item: IConversationMessage; index: number }) => {
    const isCurrentUser = item.sender.uid === user?.uid;
    const previousMessage = index > 0 ? messages[index - 1] : null;
    const showSender = !isCurrentUser && (!previousMessage || previousMessage.sender.uid !== item.sender.uid);

    return <MessageItem message={item} isCurrentUser={isCurrentUser} showSender={showSender} />;
  };

  // Render header
  const renderHeader = () => {
    if (!isFetchingNextPage) return null;

    return (
      <View style={styles.loadingMore}>
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
          <Text style={styles.emptyText}>Chargement des messages...</Text>
        </View>
      );
    }

    if (isError) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>Erreur</Text>
          <Text style={styles.emptyText}>Impossible de charger les messages</Text>
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
            {otherParticipant?.firstName && otherParticipant?.lastName
              ? `${otherParticipant.firstName} ${otherParticipant.lastName}`
              : otherParticipant?.email || 'Conversation'}
          </Text>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, isConnected && styles.statusDotConnected]} />
            <Text style={styles.statusText}>
              {isConnected ? 'En ligne' : 'Hors ligne'}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="ellipsis-vertical" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      {/* Messages list */}
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => `msg-${item.id}`}
          contentContainerStyle={messages.length === 0 ? styles.emptyList : styles.messagesList}
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
        <MessageInput onSend={handleSend} disabled={!isConnected || !otherParticipant} />
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
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
    fontWeight: '600',
    color: '#111827',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DC2626',
  },
  statusDotConnected: {
    backgroundColor: '#10B981',
  },
  statusText: {
    fontSize: 12,
    color: '#6B7280',
  },
  menuButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  messagesList: {
    paddingVertical: 16,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  loadingMore: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});
