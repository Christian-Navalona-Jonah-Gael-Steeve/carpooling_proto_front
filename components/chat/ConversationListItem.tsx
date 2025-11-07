import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { IConversation } from '@/lib/types/conversation.types';
import { Ionicons } from '@expo/vector-icons';
import { MessageStatus } from '@/lib/enums/message.enum';
import { getParticipantDisplayName, getParticipantInitials } from '@/lib/utils/participant.utils';

interface ConversationListItemProps {
  conversation: IConversation;
  currentUserUid: string;
  onPress: () => void;
}

export const ConversationListItem: React.FC<ConversationListItemProps> = ({
  conversation,
  currentUserUid,
  onPress,
}) => {
  // Get other participant(s)
  const otherParticipants = conversation.participants.filter(
    (p) => p.uid !== currentUserUid
  );
  const otherUser = otherParticipants[0];

  // Format last message time
  const formatTime = (dateString?: string) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Hier';
    } else if (diffInHours < 168) {
      return date.toLocaleDateString('fr-FR', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    }
  };

  // Get last message sender prefix
  const getMessagePrefix = () => {
    if (!conversation.lastMessage) return '';

    const isCurrentUser = conversation.lastMessage.sender.uid === currentUserUid;

    if (isCurrentUser) {
      return 'Vous: ';
    } else {
      // For group chats or showing other participant's name
      const senderFirstName = conversation.lastMessage.sender.firstName;
      if (senderFirstName) {
        return `${senderFirstName}: `;
      }
      return '';
    }
  };

  // Get message status icon
  const getStatusIcon = () => {
    if (!conversation.lastMessage) return null;
    if (conversation.lastMessage.sender.uid !== currentUserUid) return null;

    switch (conversation.lastMessage.status) {
      case MessageStatus.SENT:
        return <Ionicons name="checkmark" size={16} color="#9CA3AF" />;
      case MessageStatus.DELIVERED:
        return <Ionicons name="checkmark-done" size={16} color="#9CA3AF" />;
      case MessageStatus.READ:
        return <Ionicons name="checkmark-done" size={16} color="#2563EB" />;
      default:
        return null;
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {getParticipantInitials(otherUser)}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>
            {getParticipantDisplayName(otherUser)}
          </Text>
          {conversation.lastMessageAt && (
            <Text style={styles.time}>{formatTime(conversation.lastMessageAt)}</Text>
          )}
        </View>

        <View style={styles.footer}>
          <View style={styles.lastMessageContainer}>
            {getStatusIcon()}
            <Text
              style={[
                styles.lastMessage,
                conversation.unreadCount > 0 && styles.unreadMessage,
              ]}
              numberOfLines={1}
            >
              {conversation.lastMessage ? (
                <>
                  <Text style={styles.senderPrefix}>{getMessagePrefix()}</Text>
                  {conversation.lastMessage.content}
                </>
              ) : (
                'Pas de messages'
              )}
            </Text>
          </View>
          {conversation.unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{conversation.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  time: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  senderPrefix: {
    fontWeight: '600',
    color: '#6B7280',
  },
  unreadMessage: {
    fontWeight: '600',
    color: '#111827',
  },
  badge: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
