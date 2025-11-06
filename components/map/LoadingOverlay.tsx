import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

const LoadingOverlay = () => {
  return (
    <View style={styles.loadingOverlay}>
      <ActivityIndicator size="large" />
      <Text style={{ color: "#fff", marginTop: 8 }}>Recherche…</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default LoadingOverlay;
