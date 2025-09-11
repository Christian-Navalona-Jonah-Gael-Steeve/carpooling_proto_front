import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Chat from "../../components/chat/Chat";
import ChatList from "../../components/chat/ChatList";
import { Chat as ChatType, Message } from "../../components/chat/types";

export default function ChatsScreen() {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);

  const chats: ChatType[] = [
    {
      id: "1",
      participantName: "Sarah Johnson",
      participantType: "driver",
      lastMessage: "I'll be there in 5 minutes",
      lastMessageTime: "2m ago",
      unreadCount: 2,
      rideInfo: "Downtown → Airport",
    },
    {
      id: "2",
      participantName: "Mike Chen",
      participantType: "passenger",
      lastMessage: "Thanks for the ride!",
      lastMessageTime: "1h ago",
      unreadCount: 0,
      rideInfo: "University → Mall",
    },
    {
      id: "3",
      participantName: "Lisa Wang",
      participantType: "driver",
      lastMessage: "Meet you at the entrance",
      lastMessageTime: "3h ago",
      unreadCount: 1,
      rideInfo: "Business District → Home",
    },
  ];

  const messages: Message[] = [
    {
      id: "1",
      senderId: "1",
      text: "Hi! I'm on my way to pick you up",
      timestamp: "14:25",
      isOwn: false,
    },
    {
      id: "2",
      senderId: "me",
      text: "Great! I'm waiting at the entrance",
      timestamp: "14:26",
      isOwn: true,
    },
    {
      id: "3",
      senderId: "1",
      text: "I'll be there in 5 minutes",
      timestamp: "14:28",
      isOwn: false,
    },
  ];

  if (selectedChat) {
    const chat = chats.find((c) => c.id === selectedChat)!;
    return (
      <Chat
        chat={chat}
        messages={messages}
        onBack={() => setSelectedChat(null)}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{`Discussions`}</Text>
      </View>

      <ChatList chats={chats} onSelect={setSelectedChat} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    paddingTop: 36,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter-Bold",
    color: "#111827",
  },
});
