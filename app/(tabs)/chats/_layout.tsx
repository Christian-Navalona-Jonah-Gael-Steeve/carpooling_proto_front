import { Stack } from "expo-router";

export default function ChatsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Discussions",
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: "Conversation",
        }}
      />
    </Stack>
  );
}
