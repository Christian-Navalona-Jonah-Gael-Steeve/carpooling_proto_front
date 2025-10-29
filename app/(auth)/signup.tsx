import { useSignupMutation } from "@/hooks/mutations/auth.mutations";
import { SignupPayload } from "@/lib/types/auth.types";
import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useFormik } from "formik";
import React, { useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  Alert,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";

// 🧩 Types
type Gender = "male" | "female";
type UserType = "passenger" | "driver";

type FileType = {
  uri: string;
  name: string;
  size?: number;
  type?: string;
};

export default function SignupScreen() {
  const router = useRouter();
  const { mutateAsync: signup } = useSignupMutation();

  // States principaux
  const [gender, setGender] = useState<Gender | null>(null);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [file, setFile] = useState<FileType | null>(null);
  const [step, setStep] = useState(1);
  const stepTotal = 4;

  // Code de vérification
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const inputs = useRef<Array<TextInput | null>>([]);

  // Formik
  const { values, setFieldValue, handleSubmit } = useFormik<SignupPayload>({
    initialValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      cinNumber: "",
      password: "",
      confirmPassword: "",
    },
    onSubmit: async (payload: SignupPayload) => {
      // Validation finale avant envoi
      if (!gender) return Alert.alert("Erreur", "Veuillez sélectionner votre sexe.");
      if (!values.lastName || !values.email)
        return Alert.alert("Erreur", "Veuillez remplir tous les champs obligatoires.");
      if (!userType) return Alert.alert("Erreur", "Veuillez sélectionner un type de profil.");
      if (!file) return Alert.alert("Erreur", "Veuillez insérer une pièce justificative.");
      if (values.password !== values.confirmPassword)
        return Alert.alert("Erreur", "Les mots de passe ne correspondent pas.");

      await signup(payload);
      Alert.alert("Succès", "Inscription réussie !");
      router.replace("/(auth)/login");
    },
  });

  // Étapes
  const nextStep = () => setStep((prev) => Math.min(prev + 1, stepTotal));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleCodeChange = (value: string, index: number) => {
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Passe au champ suivant
    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/png", "image/jpeg", "image/jpg"],
        copyToCacheDirectory: true,
      });

      if (result.assets && result.assets.length > 0) {
        const f = result.assets[0];
        setFile({
          uri: f.uri,
          name: f.name,
          size: f.size ?? 0,
          type: f.mimeType,
        });
      }
    } catch (error) {
      console.error("Erreur lors du choix du fichier :", error);
    }
  };

  const isStepValid = (): boolean => {
    switch (step) {
      case 1:
        return (
          gender !== null &&
          values.lastName.trim() !== "" &&
          values.email.trim() !== ""
        );
      case 2:
        return userType !== null && file !== null;
      case 3:
        return (
          values.password.trim() !== "" &&
          values.confirmPassword.trim() !== "" &&
          values.password === values.confirmPassword
        );
      case 4:
        return code.join("").length === 6;
      default:
        return true;
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* En-tête */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.replace("/(auth)/login")}
          style={styles.backButton}
        >
          <Entypo name="chevron-left" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.title}>Créer votre compte</Text>
      </View>

      {/* Stepper */}
      <View style={styles.stepper}>
        <Text style={styles.stepText}>
          Étape {step} sur {stepTotal}
        </Text>
      </View>

      {/* === ÉTAPE 1 — Informations personnelles === */}
      {step === 1 && (
        <>
          <View style={styles.userTypeContainer}>
            <Text style={styles.sectionTitle}>Je suis *</Text>
            <View style={styles.userTypeButtons}>
              <TouchableOpacity
                style={[
                  styles.userTypeButton,
                  gender === "male" && styles.userTypeButtonActive,
                ]}
                onPress={() => setGender("male")}
              >
                <FontAwesome5
                  name="male"
                  size={24}
                  color={gender === "male" ? "#FFFFFF" : "#6B7280"}
                />
                <Text
                  style={[
                    styles.userTypeText,
                    gender === "male" && styles.userTypeTextActive,
                  ]}
                >
                  Homme
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.userTypeButton,
                  gender === "female" && styles.userTypeButtonActive,
                ]}
                onPress={() => setGender("female")}
              >
                <FontAwesome5
                  name="female"
                  size={24}
                  color={gender === "female" ? "#FFFFFF" : "#6B7280"}
                />
                <Text
                  style={[
                    styles.userTypeText,
                    gender === "female" && styles.userTypeTextActive,
                  ]}
                >
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
      )}

      {/* === ÉTAPE 2 — Type de profil & pièce === */}
      {step === 2 && (
        <View style={styles.userTypeContainer}>
          <Text style={styles.sectionTitle}>Type de profil *</Text>
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
                Passager
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
                Conducteur
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={{ fontWeight: "600", marginTop: 20 }}>
            Pièce justificative *
          </Text>
          <TouchableOpacity onPress={pickFile} style={styles.fileButton}>
            <Text style={{ color: "#fff" }}>
              {file ? "Changer le fichier" : "Choisir un fichier (PNG/JPEG/JPG)"}
            </Text>
          </TouchableOpacity>

          {file && (
            <View style={{ marginTop: 10, alignItems: "center" }}>
              <Text style={{ fontStyle: "italic", color: "#555", marginBottom: 5 }}>
                {file.name}
              </Text>
              {file.uri && (
                <Image source={{ uri: file.uri }} style={styles.previewImage} resizeMode="cover" />
              )}
            </View>
          )}
        </View>
      )}

      {/* === ÉTAPE 3 — Sécurité === */}
      {step === 3 && (
        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Mot de passe *</Text>
          <TextInput
            style={styles.input}
            placeholder="Mot de passe"
            secureTextEntry
            value={values.password}
            onChangeText={(v) => setFieldValue("password", v)}
          />
          <TextInput
            style={styles.input}
            placeholder="Confirmer le mot de passe"
            secureTextEntry
            value={values.confirmPassword}
            onChangeText={(v) => setFieldValue("confirmPassword", v)}
          />
        </View>
      )}

      {/* === ÉTAPE 4 — Code de vérification === */}
      {step === 4 && (
        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Vérification du compte</Text>
          <Text style={styles.subtitle}>
            Un code de vérification à 6 chiffres a été envoyé dans votre boîte mail.
          </Text>
          <View style={styles.codeContainer}>
            {Array.from({ length: 6 }).map((_, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  inputs.current[index] = ref;
                }}
                style={styles.codeInput}
                maxLength={1}
                keyboardType="number-pad"
                onChangeText={(value) => handleCodeChange(value, index)}
              />
            ))}
          </View>
        </View>
      )}

      {/* === Boutons navigation === */}
      <View style={styles.navigation}>
        {step > 1 ? (
          <TouchableOpacity onPress={prevStep} style={styles.backBtn}>
            <Text style={{ color: "#000" }}>Retour</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 100 }} />
        )}
        {step < stepTotal ? (
          <TouchableOpacity
            onPress={nextStep}
            style={[styles.nextBtn, !isStepValid() && { backgroundColor: "#A0AEC0" }]}
            disabled={!isStepValid()}
          >
            <Text style={{ color: "#fff" }}>Suivant</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => handleSubmit()}
            style={[styles.finishBtn, !isStepValid() && { backgroundColor: "#A0AEC0" }]}
            disabled={!isStepValid()}
          >
            <Text style={{ color: "#fff" }}>Terminer</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: { flexDirection: "row", alignItems: "center", paddingVertical: 16, paddingHorizontal: 24 },
  backButton: { marginRight: 16 },
  title: { fontSize: 24, fontWeight: "700", color: "#111827" },
  stepper: { flexDirection: "row", justifyContent: "center", marginVertical: 20 },
  stepText: { fontSize: 16, color: "#333" },
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
  fileButton: {
    backgroundColor: "#007bff",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  previewImage: {
    width: 150,
    height: 150,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  navigation: {
    paddingHorizontal: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 20,
  },
  backBtn: {
    backgroundColor: "#ccc",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  nextBtn: {
    backgroundColor: "#007bff",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  finishBtn: {
    backgroundColor: "green",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  subtitle: { textAlign: "center", color: "#6B7280", marginBottom: 10 },
  codeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 10,
  },
  codeInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    width: 45,
    height: 50,
    textAlign: "center",
    fontSize: 18,
    color: "#111827",
  },
});
