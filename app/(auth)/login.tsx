import { useAuth } from "@/contexts/auth.context";
import { useSigninMutation } from "@/hooks/mutations/auth.mutations";
import { SigninPayload } from "@/lib/types/auth.types";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useFormik } from "formik";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { isLoading } from "expo-font";

/**
 * Login screen component with authentication integration
 * Handles user sign-in and navigation to protected tabs
 */
export default function LoginScreen() {
  const router = useRouter();
  const { mutateAsync: signin } = useSigninMutation();
  const { login } = useAuth();
  const [isloading, setLoading] = useState(false);

  const { values, setFieldValue, handleSubmit } = useFormik<SigninPayload>({
    initialValues: {
      email: "",
      password: "",
    },
    enableReinitialize: true,
    onSubmit: async (payload: SigninPayload) => {
      setLoading(true);
      try {
        // Authenticate user via API
        const response = await signin(payload);

        // Use AuthContext to handle login and token storage
        await login({
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
        });

        // Navigate to protected tabs
        router.replace("/(tabs)/home");
      } catch (error) {
        console.error("Login failed:", error);
        // Handle login error (you might want to show an error message)
      } finally {
        setLoading(false);
      }
    },
  });
  const isFormValid = values.email.trim() !== "" && values.password.trim() !== "";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{`Bienvenue !`}</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.subtitle}>{`Connectez-vous à votre compte`}</Text>

        <View style={styles.inputContainer}>
          <MaterialIcons name="mail-outline" size={20} color="#6B7280" />
          <TextInput
            style={styles.input}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#9CA3AF"
            value={values.email}
            onChangeText={(value) => setFieldValue("email", value)}
          />
        </View>

        <View style={styles.inputContainer}>
          <MaterialIcons name="lock-outline" size={20} color="#6B7280" />
          <TextInput
            style={styles.input}
            placeholder={`Mot de passe`}
            secureTextEntry
            placeholderTextColor="#9CA3AF"
            value={values.password}
            onChangeText={(value) => setFieldValue("password", value)}
          />
        </View>

        <TouchableOpacity onPress={() => router.push("/(auth)/forgot-password")}>
          <Text style={styles.forgotPassword}>{`Mot de passe oublié ? `}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.loginButton,
            !isFormValid && styles.loginButtonDisabled, // style quand désactivé
          ]}
          onPress={() => handleSubmit()}
          disabled={!isFormValid}
        >
          <Text style={styles.loginButtonText}>{!isloading ? `Se connecter` : `Connexion . . . `}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/(auth)/signup")}>
          <Text style={styles.signupLink}>
            {`Vouz n'avez pas encore de compte ?`}
          </Text>
          <Text style={styles.signupLinkBold}>{`S'inscrire`}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backButton: {
    marginRight: 16,
  },
  loginButtonDisabled: {
    backgroundColor: "#A5B4FC", // couleur plus claire pour montrer que c'est désactivé
  },

  title: {
    fontSize: 24,
    fontFamily: "Inter-Bold",
    color: "#111827",
  },
  form: {
    paddingHorizontal: 24,
    gap: 20,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Inter-Regular",
    color: "#6B7280",
    marginBottom: 16,
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
  forgotPassword: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    color: "#2563EB",
    textAlign: "right",
  },
  loginButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  loginButtonText: {
    fontSize: 18,
    fontFamily: "Inter-SemiBold",
    color: "#FFFFFF",
  },
  signupLink: {
    fontSize: 16,
    fontFamily: "Inter-Regular",
    color: "#6B7280",
    textAlign: "center",
    marginTop: 24,
  },
  signupLinkBold: {
    textAlign: "center",
    fontFamily: "Inter-SemiBold",
    color: "#2563EB",
  },
});
