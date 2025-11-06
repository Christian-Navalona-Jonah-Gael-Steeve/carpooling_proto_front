import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { WebSocketProvider } from "@/contexts/websocket.context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet } from "react-native";

export default function TabLayout() {
  return (
    <ProtectedRoute>
      <WebSocketProvider>
        <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
          <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: "#FFFFFF",
            borderTopWidth: 1,
            borderTopColor: "#E5E7EB",
            paddingBottom: 8,
            paddingTop: 8,
            height: 80,
          },
          tabBarActiveTintColor: "#2563EB",
          tabBarInactiveTintColor: "#6B7280",
          tabBarLabelStyle: {
            fontSize: 12,
            fontFamily: "Inter-SemiBold",
            marginTop: 4,
          },
        }}
      >
        <Tabs.Screen
          name="search"
          options={{
            title: "Search",
            tabBarIcon: ({ size, color }) => (
              <Ionicons
                name="search-outline"
                size={size}
                color={color}
                strokeWidth={2}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="home"
          options={{
            title: "Accueil",
            tabBarIcon: ({ size, color }) => (
              <Ionicons
                name="add-circle-outline"
                size={size}
                color={color}
                strokeWidth={2}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="chats"
          options={{
            title: "Chats",
            tabBarIcon: ({ size, color }) => (
              <Ionicons
                name="chatbubbles-outline"
                size={size}
                color={color}
                strokeWidth={2}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="maps"
          options={{
            title: "Maps",
            tabBarIcon: ({ size, color }) => (
              <Ionicons
                name="map-outline"
                size={size}
                color={color}
                strokeWidth={2}
              />
            ),
          }}
        />
      </Tabs>
        </SafeAreaView>
      </WebSocketProvider>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
});
