import { useSignupMutation } from "@/hooks/mutations/auth.mutations";
import { SignupPayload } from "@/lib/types/auth.types";
import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useFormik } from "formik";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function SignupScreen() {
  const router = useRouter();
  const [userType, setUserType] = useState<"passenger" | "driver">("passenger");
  const { mutateAsync: signup } = useSignupMutation();

  const { values, setFieldValue } = useFormik<SignupPayload>({
    initialValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      cinNumber: "",
      password: "",
      confirmPassword: "",
    },
    enableReinitialize: true,
    onSubmit: async (payload: SignupPayload) => {
      await signup(payload);
      router.replace("/(auth)/login");
    },
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.replace("/(auth)/login")}
          style={styles.backButton}
        >
          <Entypo name="chevron-left" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.title}>{`Créer votre compte`}</Text>
      </View>

      <View style={styles.userTypeContainer}>
        <Text style={styles.sectionTitle}>{`Je suis`}</Text>
        <View style={styles.userTypeButtons}>
          <TouchableOpacity
            style={[
              styles.userTypeButton,
              userType === "passenger" && styles.userTypeButtonActive,
            ]}
            onPress={() => setUserType("passenger")}
          >
            <FontAwesome5
              name="user"
              size={24}
              color={userType === "passenger" ? "#FFFFFF" : "#6B7280"}
            />
            <Text
              style={[
                styles.userTypeText,
                userType === "passenger" && styles.userTypeTextActive,
              ]}
            >
              {`Passager`}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.userTypeButton,
              userType === "driver" && styles.userTypeButtonActive,
            ]}
            onPress={() => setUserType("driver")}
          >
            <FontAwesome5
              name="car-side"
              size={24}
              color={userType === "driver" ? "#FFFFFF" : "#6B7280"}
            />
            <Text
              style={[
                styles.userTypeText,
                userType === "driver" && styles.userTypeTextActive,
              ]}
            >
              {`Conducteur`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <FontAwesome5 name="user" size={20} color="#6B7280" />
          <TextInput
            style={styles.input}
            placeholder={`Nom`}
            placeholderTextColor="#9CA3AF"
            value={values.lastName}
            onChangeText={(value) => setFieldValue("lastName", value)}
          />
        </View>

        <View style={styles.inputContainer}>
          <FontAwesome5 name="user" size={20} color="#6B7280" />
          <TextInput
            style={styles.input}
            placeholder={`Prénom`}
            placeholderTextColor="#9CA3AF"
            value={values.lastName}
            onChangeText={(value) => setFieldValue("lastName", value)}
          />
        </View>

        <View style={styles.inputContainer}>
          <MaterialIcons name="mail-outline" size={20} color="#6B7280" />
          <TextInput
            style={styles.input}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#9CA3AF"
            value={values.firstName}
            onChangeText={(value) => setFieldValue("firstName", value)}
          />
        </View>

        <View style={styles.inputContainer}>
          <MaterialIcons name="phone" size={20} color="#6B7280" />
          <TextInput
            style={styles.input}
            placeholder={`Numéro de téléphone`}
            keyboardType="phone-pad"
            placeholderTextColor="#9CA3AF"
            value={values.phoneNumber}
            onChangeText={(value) => setFieldValue("phoneNumber", value)}
          />
        </View>

        <View style={styles.inputContainer}>
          <FontAwesome5 name="id-card" size={20} color="#6B7280" />
          <TextInput
            style={styles.input}
            placeholder={`Numéro de CIN`}
            placeholderTextColor="#9CA3AF"
            value={values.cinNumber}
            onChangeText={(value) => setFieldValue("cinNumber", value)}
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

        <View style={styles.inputContainer}>
          <MaterialIcons name="lock-outline" size={20} color="#6B7280" />
          <TextInput
            style={styles.input}
            placeholder={`Confirmation du mot de passe`}
            secureTextEntry
            placeholderTextColor="#9CA3AF"
            value={values.confirmPassword}
            onChangeText={(value) => setFieldValue("confirmPassword", value)}
          />
        </View>

        <TouchableOpacity style={styles.signupButton}>
          <Text style={styles.signupButtonText}>{`Créer`}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
          <Text style={styles.loginLink}>{`Vous avez déjà un compte ?`}</Text>
          <Text style={styles.loginLinkBold}>{`Se connecter`} </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  title: {
    fontSize: 24,
    fontFamily: "Inter-Bold",
    color: "#111827",
  },
  userTypeContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter-SemiBold",
    color: "#374151",
    marginBottom: 16,
  },
  userTypeButtons: {
    flexDirection: "row",
    gap: 16,
  },
  userTypeButton: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  userTypeButtonActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  userTypeText: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
    color: "#6B7280",
    marginTop: 8,
  },
  userTypeTextActive: {
    color: "#FFFFFF",
  },
  form: {
    paddingHorizontal: 24,
    gap: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
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
  inputIcon: {
    fontSize: 20,
    fontFamily: "Inter-Bold",
    color: "#6B7280",
  },
  signupButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  signupButtonText: {
    fontSize: 18,
    fontFamily: "Inter-SemiBold",
    color: "#FFFFFF",
  },
  loginLink: {
    fontSize: 16,
    fontFamily: "Inter-Regular",
    color: "#6B7280",
    textAlign: "center",
    marginTop: 24,
  },
  loginLinkBold: {
    fontFamily: "Inter-SemiBold",
    textAlign: "center",
    color: "#2563EB",
  },
});
