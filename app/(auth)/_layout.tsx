import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet } from "react-native";

export default function AuthLayout() {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'right', 'bottom', 'left']}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
      </Stack>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
});
