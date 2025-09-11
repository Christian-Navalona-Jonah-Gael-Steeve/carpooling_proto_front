import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Chat } from "./types";

type Props = {
  chat: Chat;
  onPress: () => void;
};

export default function ChatListItem({ chat, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.chatItem} onPress={onPress}>
      <View style={styles.chatAvatar}>
        <Text style={styles.chatInitial}>{chat.participantName.charAt(0)}</Text>
      </View>

      <View style={styles.chatContent}>
        <View style={styles.chatHeaderRow}>
          <Text style={styles.chatName}>{chat.participantName}</Text>
          <Text style={styles.chatTime}>{chat.lastMessageTime}</Text>
        </View>
        <Text style={styles.rideInfo}>{chat.rideInfo}</Text>
        <Text style={styles.lastMessage} numberOfLines={1}>
          {chat.lastMessage}
        </Text>
      </View>

      {chat.unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadText}>{chat.unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  chatAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  chatInitial: {
    fontSize: 18,
    fontFamily: "Inter-Bold",
    color: "#FFFFFF",
  },
  chatContent: {
    flex: 1,
  },
  chatHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chatName: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
    color: "#111827",
  },
  chatTime: {
    fontSize: 12,
    fontFamily: "Inter-Regular",
    color: "#6B7280",
  },
  rideInfo: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    color: "#2563EB",
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    color: "#6B7280",
  },
  unreadBadge: {
    backgroundColor: "#DC2626",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadText: {
    fontSize: 12,
    fontFamily: "Inter-Bold",
    color: "#FFFFFF",
  },
});

