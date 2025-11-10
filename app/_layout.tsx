import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { LogBox } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

import { useColorScheme } from "@/hooks/useColorScheme";
import ReactQueryProvider from "@/providers/react-query.provider";
import { AuthProvider } from "@/contexts/auth.context";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Disable all warnings and errors in LogBox
LogBox.ignoreAllLogs(true);

// Alternatively, ignore specific warnings:
// LogBox.ignoreLogs([
//   'Warning: ...',
//   'VirtualizedLists should never be nested',
// ]);

// Suppress console warnings and errors (optional - uncomment if needed)
// console.warn = () => {};
// console.error = () => {};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ReactQueryProvider>
        <AuthProvider>
          <ThemeProvider
            value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
          >
            <Stack>
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
        </AuthProvider>
      </ReactQueryProvider>
    </SafeAreaProvider>
  );
}
