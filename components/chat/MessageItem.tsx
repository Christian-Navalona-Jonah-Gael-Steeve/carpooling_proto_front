import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Message } from "./types";

type Props = {
  message: Message;
};

export default function MessageItem({ message }: Props) {
  return (
    <View style={[styles.messageBubble, message.isOwn && styles.ownMessage]}>
      <Text style={[styles.messageText, message.isOwn && styles.ownMessageText]}>
        {message.text}
      </Text>
      <Text style={[styles.messageTime, message.isOwn && styles.ownMessageTime]}>
        {message.timestamp}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  messageBubble: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    marginBottom: 12,
    maxWidth: "80%",
    alignSelf: "flex-start",
  },
  ownMessage: {
    backgroundColor: "#2563EB",
    alignSelf: "flex-end",
  },
  messageText: {
    fontSize: 16,
    fontFamily: "Inter-Regular",
    color: "#111827",
  },
  ownMessageText: {
    color: "#FFFFFF",
  },
  messageTime: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
    color: "#6B7280",
    marginTop: 4,
  },
  ownMessageTime: {
    color: "#E5E7EB",
  },
});

