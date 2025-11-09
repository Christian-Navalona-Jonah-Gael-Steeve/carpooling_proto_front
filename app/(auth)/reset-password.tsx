import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8080/api";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams(); // si tu passes l'email ou autre info via params
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const email = params.email as string; // TypeScript cast

  const handleResetPassword = async () => {
    if (!code.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Erreur", "Les mots de passe ne correspondent pas.");
      return;
    }

    try {
      setIsLoading(true);
      console.log("Resetting password for:", email);
      console.log(code, newPassword);
      const response = await fetch(`${API_BASE_URL}/auth/reset-password-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          code,
          newPassword,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(err || "Erreur lors de la réinitialisation du mot de passe.");
      }

      Alert.alert(
        "Succès ✅",
        "Votre mot de passe a été réinitialisé.",
        [{ text: "OK", onPress: () => router.push("/(auth)/login") }]
      );
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
            <Text style={styles.headerTitle}>Réinitialiser le mot de passe</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.subtitle}>
              Entrez le code reçu par email et choisissez un nouveau mot de passe.
            </Text>
            <Text style={[styles.subtitle, { color: "green", fontWeight: "bold" }]}>
              Un code de réinitilisation à 6 chiffres a été envoyé dans votre boîte mail.
            </Text>

            <View style={styles.inputContainer}>
              <MaterialIcons name="vpn-key" size={20} color="#6B7280" />
              <TextInput
                style={styles.input}
                placeholder="Code de réinitialisation"
                keyboardType="numeric"
                value={code}
                onChangeText={setCode}
              />
            </View>

            <View style={styles.inputContainer}>
              <MaterialIcons name="lock-outline" size={20} color="#6B7280" />
              <TextInput
                style={styles.input}
                placeholder="Nouveau mot de passe"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
              />
            </View>

            <View style={styles.inputContainer}>
              <MaterialIcons name="lock-outline" size={20} color="#6B7280" />
              <TextInput
                style={styles.input}
                placeholder="Confirmer mot de passe"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, (!code || !newPassword || !confirmPassword) && styles.disabledButton]}
              onPress={handleResetPassword}
              disabled={!code || !newPassword || !confirmPassword || isLoading}
            >
              <Text style={styles.submitButtonText}>
                {isLoading ? "En cours..." : "Réinitialiser le mot de passe"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
              <Text style={styles.backToLogin}>{`← Retour à la connexion`}</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 24, paddingVertical: 16, gap: 16 },
  headerTitle: { fontSize: 20, fontFamily: "Inter-Bold", color: "#111827" },
  form: { flex: 1, paddingHorizontal: 24, justifyContent: "center", gap: 24 },
  subtitle: { fontSize: 16, fontFamily: "Inter-Regular", color: "#6B7280", textAlign: "center", marginBottom: 8 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  input: { flex: 1, paddingVertical: 16, paddingLeft: 12, fontSize: 16, fontFamily: "Inter-Regular", color: "#111827" },
  submitButton: { backgroundColor: "#2563EB", paddingVertical: 16, borderRadius: 12, alignItems: "center" },
  disabledButton: { backgroundColor: "#A5B4FC" },
  submitButtonText: { fontSize: 18, fontFamily: "Inter-SemiBold", color: "#FFFFFF" },
  backToLogin: { fontSize: 16, color: "#2563EB", textAlign: "center", fontFamily: "Inter-Regular", marginTop: 12 },
});
