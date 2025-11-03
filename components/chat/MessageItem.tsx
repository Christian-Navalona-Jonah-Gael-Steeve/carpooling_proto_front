import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { IConversationMessage } from '@/lib/types/conversation.types';
import { MessageStatus } from '@/lib/enums/message.enum';
import { Ionicons } from '@expo/vector-icons';

interface MessageItemProps {
  message: IConversationMessage;
  isCurrentUser: boolean;
  showSender?: boolean;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isCurrentUser,
  showSender = false,
}) => {
  // Format message time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  // Get status icon for sent messages
  const getStatusIcon = () => {
    if (!isCurrentUser) return null;

    switch (message.status) {
      case MessageStatus.SENT:
        return <Ionicons name="checkmark" size={14} color="#9CA3AF" />;
      case MessageStatus.DELIVERED:
        return <Ionicons name="checkmark-done" size={14} color="#9CA3AF" />;
      case MessageStatus.READ:
        return <Ionicons name="checkmark-done" size={14} color="#2563EB" />;
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, isCurrentUser ? styles.containerRight : styles.containerLeft]}>
      {showSender && !isCurrentUser && (
        <Text style={styles.senderName}>
          {message.sender.firstName && message.sender.lastName
            ? `${message.sender.firstName} ${message.sender.lastName}`
            : message.sender.email}
        </Text>
      )}

      <View
        style={[
          styles.bubble,
          isCurrentUser ? styles.bubbleCurrentUser : styles.bubbleOtherUser,
        ]}
      >
        <Text style={[styles.messageText, isCurrentUser && styles.messageTextCurrentUser]}>
          {message.content}
        </Text>
        <View style={styles.footer}>
          <Text
            style={[
              styles.time,
              isCurrentUser ? styles.timeCurrentUser : styles.timeOtherUser,
            ]}
          >
            {formatTime(message.sentAt)}
          </Text>
          {getStatusIcon()}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    paddingHorizontal: 16,
    maxWidth: '80%',
  },
  containerLeft: {
    alignSelf: 'flex-start',
  },
  containerRight: {
    alignSelf: 'flex-end',
  },
  senderName: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    marginLeft: 12,
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  bubbleCurrentUser: {
    backgroundColor: '#2563EB',
    borderBottomRightRadius: 4,
  },
  bubbleOtherUser: {
    backgroundColor: '#F3F4F6',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    color: '#111827',
  },
  messageTextCurrentUser: {
    color: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  time: {
    fontSize: 11,
  },
  timeCurrentUser: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  timeOtherUser: {
    color: '#9CA3AF',
  },
});
