import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Chat as ChatType, Message } from "../../lib/types/chat.types";
import { useChat } from "./ChatContext";
import MessageItem from "./MessageItem";

type Props = {
  chat: ChatType;
  messages: Message[];
  onBack: () => void;
};

export default function Chat({ chat, messages, onBack }: Props) {
  const [messageText, setMessageText] = useState("");
  const { sendMessage } = useChat();
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSendMessage = () => {
    if (messageText.trim()) {
      sendMessage(chat.id, messageText.trim());
      setMessageText("");
    }
  };

  const handleCall = () => {
    Alert.alert("Call", `Calling ${chat.participantName}...`);
  };

  const handleVideoCall = () => {
    Alert.alert(
      "Video Call",
      `Starting video call with ${chat.participantName}...`
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.chatHeader}>
        <TouchableOpacity
          onPress={onBack}
          accessibilityLabel="Go back to chat list"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back-outline" size={20} color="#2563EB" />
        </TouchableOpacity>
        <View style={styles.chatHeaderInfo}>
          <Text style={styles.chatHeaderName}>{chat.participantName}</Text>
          <Text style={styles.chatHeaderRide}>{chat.rideInfo}</Text>
        </View>
        <View style={styles.callButtons}>
          <TouchableOpacity
            style={styles.callButton}
            onPress={handleCall}
            accessibilityLabel={`Call ${chat.participantName}`}
            accessibilityRole="button"
          >
            <Ionicons name="call-outline" size={20} color="#2563EB" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.callButton}
            onPress={handleVideoCall}
            accessibilityLabel={`Video call ${chat.participantName}`}
            accessibilityRole="button"
          >
            <Ionicons name="videocam-outline" size={20} color="#2563EB" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))}
      </ScrollView>

      <View style={styles.messageInputContainer}>
        <TextInput
          style={styles.messageInput}
          placeholder="Type a message..."
          value={messageText}
          onChangeText={setMessageText}
          multiline
          placeholderTextColor="#9CA3AF"
          onSubmitEditing={handleSendMessage}
          blurOnSubmit={false}
          returnKeyType="send"
          accessibilityLabel="Message input"
          accessibilityHint="Type your message here and press send"
        />
        <TouchableOpacity
          style={[styles.sendButton, { opacity: messageText.trim() ? 1 : 0.5 }]}
          onPress={handleSendMessage}
          disabled={!messageText.trim()}
          accessibilityLabel="Send message"
          accessibilityRole="button"
          accessibilityState={{ disabled: !messageText.trim() }}
        >
          <Ionicons name="send-outline" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    marginBottom: 4,
  },
  chatHeaderInfo: {
    flex: 1,
    alignItems: "center",
  },
  chatHeaderName: {
    fontSize: 18,
    fontFamily: "Inter-SemiBold",
    color: "#111827",
  },
  chatHeaderRide: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
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
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  messageInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: "Inter-Regular",
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    backgroundColor: "#2563EB",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
});
