import { useSignupMutation } from "@/hooks/mutations/auth.mutations";
import { SignupPayload } from "@/lib/types/auth.types";
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
import Entypo from "@expo/vector-icons/Entypo";

// 🧩 Import des steps
import Step1PersonalInfo from "@/components/signup/Step1PersonalInfo";
import Step2UserTypeFile from "@/components/signup/Step2UserTypeFile";
import Step3Security from "@/components/signup/Step3Security";
import Step4Verification from "@/components/signup/Step4Verification";

import { styles } from "@/utils/style";
import { FileType, Gender, UserType } from "@/utils/type";
import * as DocumentPicker from "expo-document-picker";

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

  // === Navigation entre étapes ===
  const nextStep = () => setStep((prev) => Math.min(prev + 1, stepTotal));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  // === Validation par étape ===
  const isStepValid = (): boolean => {
    switch (step) {
      case 1:
        return gender !== null && values.lastName.trim() !== "" && values.email.trim() !== "";
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

  // === Gestion du code de vérification ===
  const handleCodeChange = (value: string, index: number) => {
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* --- HEADER --- */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.replace("/(auth)/login")}
          style={styles.backButton}
        >
          <Entypo name="chevron-left" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.title}>Créer votre compte</Text>
      </View>

      {/* --- STEPPER --- */}
      <View style={styles.stepper}>
        <Text style={styles.stepText}>Étape {step} sur {stepTotal}</Text>
      </View>

      {/* --- ÉTAPES --- */}
      {step === 1 && (
        <Step1PersonalInfo
          gender={gender}
          setGender={setGender}
          values={values}
          setFieldValue={setFieldValue}
        />
      )}

      {step === 2 && (
        <Step2UserTypeFile
          userType={userType}
          setUserType={setUserType}
          file={file}
          setFile={setFile}
          pickFile={pickFile}
        />
      )}

      {step === 3 && (
        <Step3Security
          values={values}
          setFieldValue={setFieldValue}
        />
      )}

      {step === 4 && (
        <Step4Verification
          code={code}
          setCode={setCode}
          inputs={inputs}
          handleCodeChange={handleCodeChange}
        />
      )}

      {/* --- NAVIGATION --- */}
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
