import React from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { SignupPayload } from "@/lib/types/auth.types";
import { Gender } from "@/utils/type";

interface Props {
  gender: Gender | null;
  setGender: (v: Gender) => void;
  values: SignupPayload;
  setFieldValue: (field: string, value: any) => void;
}

export default function Step1PersonalInfo({ gender, setGender, values, setFieldValue }: Props) {
  return (
    <>
      <View style={styles.userTypeContainer}>
        <Text style={styles.sectionTitle}>Je suis *</Text>
        <View style={styles.userTypeButtons}>
          <TouchableOpacity
            style={[styles.userTypeButton, gender === "male" && styles.userTypeButtonActive]}
            onPress={() => setGender("male")}
          >
            <FontAwesome5
              name="male"
              size={24}
              color={gender === "male" ? "#FFFFFF" : "#6B7280"}
            />
            <Text style={[styles.userTypeText, gender === "male" && styles.userTypeTextActive]}>
              Homme
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.userTypeButton, gender === "female" && styles.userTypeButtonActive]}
            onPress={() => setGender("female")}
          >
            <FontAwesome5
              name="female"
              size={24}
              color={gender === "female" ? "#FFFFFF" : "#6B7280"}
            />
            <Text style={[styles.userTypeText, gender === "female" && styles.userTypeTextActive]}>
              Femme
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Nom *"
          value={values.lastName}
          onChangeText={(v) => setFieldValue("lastName", v)}
        />
        <TextInput
          style={styles.input}
          placeholder="Prénom"
          value={values.firstName}
          onChangeText={(v) => setFieldValue("firstName", v)}
        />
        <TextInput
          style={styles.input}
          placeholder="Email *"
          keyboardType="email-address"
          autoCapitalize="none"
          value={values.email}
          onChangeText={(v) => setFieldValue("email", v)}
        />
        <TextInput
          style={styles.input}
          placeholder="Numéro de téléphone"
          keyboardType="phone-pad"
          value={values.phoneNumber}
          onChangeText={(v) => setFieldValue("phoneNumber", v)}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 18, fontWeight: "600", color: "#374151", marginBottom: 16 },
  userTypeContainer: { paddingHorizontal: 24, marginBottom: 32 },
  userTypeButtons: { flexDirection: "row", gap: 16 },
  userTypeButton: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    paddingVertical: 20,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  userTypeButtonActive: { backgroundColor: "#2563EB", borderColor: "#2563EB" },
  userTypeText: { fontSize: 16, fontWeight: "600", color: "#6B7280", marginTop: 8 },
  userTypeTextActive: { color: "#FFFFFF" },
  form: { paddingHorizontal: 24, gap: 16 },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
});
