import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Chat } from "./types";
import ChatListItem from "./ChatListItem";

type Props = {
  chats: Chat[];
  onSelect: (chatId: string) => void;
};

export default function ChatList({ chats, onSelect }: Props) {
  return (
    <ScrollView style={styles.chatsList} showsVerticalScrollIndicator={false}>
      {chats.length > 0 ? (
        chats.map((chat) => (
          <ChatListItem key={chat.id} chat={chat} onPress={() => onSelect(chat.id)} />
        ))
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubbles-outline" size={48} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>{`Vous n'avez pas de discussions`}</Text>
          <Text style={styles.emptySubtitle}>{
            `Commencez une nouvelle discussion en rǸservant un trajet !`
          }</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chatsList: {
    flex: 1,
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

