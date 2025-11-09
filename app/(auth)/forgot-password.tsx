import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, ScrollView, Platform } from "react-native";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8080/api";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert("Erreur", "Veuillez entrer adresse e-mail valide");
      return;
    }
    if (!email.trim()) {
      Alert.alert("Erreur", "Veuillez entrer votre adresse e-mail.");
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(err || "Erreur lors de l'envoi de l'email");
      }

      router.push({ pathname: "/(auth)/reset-password", params: { email } });

    } catch (error: any) {
      Alert.alert("Erreur", error.message || "Une erreur est survenue.");
    } finally {
      setIsLoading(false);
    }
  };

  return (

    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
      keyboardVerticalOffset={80} // ajuste si tu as un header
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: 40,
          backgroundColor: "#fff",
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <MaterialIcons name="arrow-back" size={28} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Mot de passe oublié</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.subtitle}>
              Entrez votre adresse e-mail pour recevoir le code de réinitialisation.
            </Text>

            <View style={styles.inputContainer}>
              <MaterialIcons name="mail-outline" size={20} color="#6B7280" />
              <TextInput
                style={styles.input}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, !email.trim() && styles.disabledButton]}
              disabled={!email.trim() || isLoading}
              onPress={handleForgotPassword}
            >
              <Text style={styles.submitButtonText}>
                {isLoading ? "Envoi en cours..." : "Envoyer le code de réinitialisation"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
              <Text style={styles.backToLogin}>{`← Retour à la connexion`}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView >
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Inter-Bold",
    color: "#111827",
  },
  form: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    gap: 24,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Inter-Regular",
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingLeft: 12,
    fontSize: 16,
    fontFamily: "Inter-Regular",
    color: "#111827",
  },
  submitButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#A5B4FC",
  },
  submitButtonText: {
    fontSize: 18,
    fontFamily: "Inter-SemiBold",
    color: "#FFFFFF",
  },
  backToLogin: {
    fontSize: 16,
    color: "#2563EB",
    textAlign: "center",
    fontFamily: "Inter-Regular",
    marginTop: 12,
  },
});
