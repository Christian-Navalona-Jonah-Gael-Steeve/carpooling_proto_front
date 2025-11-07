import React from "react";
import { View, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ConversationDetail } from "@/components/chat/ConversationDetail";

export default function ConversationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  if (!id) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ConversationDetail
        conversationId={parseInt(id, 10)}
        onBack={handleBack}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
});
