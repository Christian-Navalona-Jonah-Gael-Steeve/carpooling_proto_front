import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Chat from "../../components/chat/Chat";
import ChatList from "../../components/chat/ChatList";
import { ChatProvider, useChat } from "../../components/chat/ChatContext";

function ChatsContent() {
  const { state, selectChat, loadChats } = useChat();
  const { chats, messages, selectedChatId } = state;

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  if (selectedChatId) {
    const chat = chats.find((c) => c.id === selectedChatId);
    const chatMessages = messages[selectedChatId] || [];
    
    if (!chat) return null;

    return (
      <Chat
        chat={chat}
        messages={chatMessages}
        onBack={() => selectChat(null)}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Discussions</Text>
      </View>

      <ChatList chats={chats} onSelect={selectChat} />
    </View>
  );
}

export default function ChatsScreen() {
  return (
    <ChatProvider>
      <ChatsContent />
    </ChatProvider>
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
