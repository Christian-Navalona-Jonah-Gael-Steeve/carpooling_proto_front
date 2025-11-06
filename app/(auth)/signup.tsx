import { useSignupMutation } from "@/hooks/mutations/auth.mutations";
import { SignupPayload } from "@/lib/types/auth.types";
import { useRouter } from "expo-router";
import { useFormik } from "formik";
import React, { useRef, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import Entypo from "@expo/vector-icons/Entypo";

import Step1PersonalInfo from "@/components/signup/Step1PersonalInfo";
import Step2UserTypeFile from "@/components/signup/Step2UserTypeFile";
import Step3Security from "@/components/signup/Step3Security";
import Step4Verification from "@/components/signup/Step4Verification";

import { styles } from "@/utils/style";
import { FileType, Gender, UserType } from "@/utils/type";
import * as FileSystem from "expo-file-system";

export const sendSignup = async (url: string, payload: SignupPayload, file: FileType | null) => {
  const formData = new FormData();

  formData.append("user", JSON.stringify(payload));

  if (file) {
    let fileUri = file.uri;

    // 🧩 Si c’est une URI base64, on la convertit en fichier temporaire
    if (fileUri.startsWith("data:")) {
      const base64 = fileUri.split(",")[1];
      const path = FileSystem.cacheDirectory + (file.name || "photo.jpg");
      await FileSystem.writeAsStringAsync(path, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      fileUri = path; // le remplacer par un vrai fichier local
    }

    if (file) {
      formData.append("photo", {
        uri: file.uri,
        name: file.name || "photo.jpg",
        type: file.type || "image/jpeg",
      } as unknown as Blob);
    }

  }

  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Erreur inscription: ${err}`);
  }

  return response.json();
};

export const verifyCode = async (url: string, email: string, code: string) => {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Code invalide");
  }

  return response.json();
};

// === COMPOSANT PRINCIPAL ===
export default function SignupScreen() {
  const router = useRouter();

  const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

  const [gender, setGender] = useState<Gender | null>(null);
  const [userType, setUserType] = useState<UserType>("PASSENGER");
  const [file, setFile] = useState<FileType | null>(null);
  const [step, setStep] = useState(1);
  const stepTotal = 4;

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const inputs = useRef<Array<TextInput | null>>([]);
  const [is_step_3_loading, setIsStep3Loading] = useState(false);
  const [is_step_3_done, setIsStep3Done] = useState(false);
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 Mo en bytes

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
    onSubmit: () => { },
  });

  // === VALIDATION PAR ÉTAPE ===
  const isStepValid = (): boolean => {
    switch (step) {
      case 1:
        return gender !== null && values.lastName.trim() !== "" && values.email.trim() !== "" && values.phoneNumber.trim() !== "";
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

  // === FONCTIONS DE NAVIGATION ===
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));
  const nextStep = () => setStep((prev) => Math.min(prev + 1, stepTotal));

  // === PICK FICHIER ===
  const pickFile = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        const asset = result.assets[0];

        // Vérifier la taille du fichier
        let fileSize = asset.fileSize; // Certains versions d'Expo renvoient fileSize
        if (!fileSize && asset.uri) {

          const info = await FileSystem.getInfoAsync(asset.uri);
          const fileSize = info.exists ? info.size ?? 0 : 0;

          if (fileSize > MAX_FILE_SIZE) {
            Alert.alert(
              "Fichier trop volumineux",
              `Veuillez sélectionner un fichier inférieur à ${MAX_FILE_SIZE / (1024 * 1024)} Mo.`
            );
            return; // Empêche la suite
          }
        }

        if (fileSize && fileSize > MAX_FILE_SIZE) {
          Alert.alert(
            "Fichier trop volumineux",
            `Veuillez sélectionner un fichier inférieur à ${MAX_FILE_SIZE / (1024 * 1024)} Mo.`
          );
          return; // Ne pas continuer
        }

        const newFile: FileType = {
          uri: asset.uri,
          name: asset.fileName || "photo.jpg",
          type: asset.mimeType || "image/jpeg",
        };
        setFile(newFile);
        console.log("✅ Fichier choisi:", newFile);
      }
    } catch (error) {
      console.error("Erreur lors du choix du fichier:", error);
    }
  };

  // === SIGNUP ===
  const handleSignup = async () => {
    setIsStep3Loading(true);
    try {
      console.log("file -", file);
      if (!gender || !userType || !file)
        return Alert.alert("Erreur", "Veuillez compléter les étapes précédentes.");
      if (values.password !== values.confirmPassword)
        return Alert.alert("Erreur", "Les mots de passe ne correspondent pas.");
      const signupPayload = { ...values, gender, userType };
      console.log("signupPayload", signupPayload);
      await sendSignup(`${API_BASE_URL}/auth/signup`, signupPayload, file);

      console.log("ok -------------- ");
      Alert.alert("Succès", "Inscription réussie ! Vérifiez votre email.");
      console.log("ok -------------- ", step);
      setStep(4);
      console.log("ok 5-------------- ", step);
      setIsStep3Done(true);
      setIsStep3Loading(false);
    } catch (err: any) {
      setIsStep3Done(false);
      console.error(err);
      Alert.alert("Erreur", err.message);
    }
    finally {
      setIsStep3Loading(false);
    }
  };

  // === VERIFICATION CODE ===
  const handleVerifyCode = async () => {
    const codeStr = code.join("");
    try {
      await verifyCode(`${API_BASE_URL}/auth/verify-code`, values.email, codeStr);
      Alert.alert("Succès", "Code vérifié ! Vous pouvez vous connecter.");
      router.replace("/(auth)/login");
    } catch (err: any) {
      Alert.alert("Erreur", err.message);
    }
  };

  // === HANDLE CODE INPUT ===
  const handleCodeChange = (value: string, index: number) => {
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    if (value && index < 5) inputs.current[index + 1]?.focus();
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/(auth)/login")} style={styles.backButton}>
          <Entypo name="chevron-left" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.title}>Créer votre compte</Text>
      </View>

      {/* STEPPER */}
      <View style={styles.stepper}>
        <Text style={styles.stepText}>Étape {step} sur {stepTotal}</Text>
      </View>

      {/* ETAPES */}
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
          isStep3Done={is_step_3_done}
        />
      )}

      {/* NAVIGATION */}
      <View style={styles.navigation}>
        {step > 1 ? (
          <TouchableOpacity onPress={prevStep} style={styles.backBtn}>
            <Text style={{ color: "#000" }}>Retour</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 100 }} />
        )}

        {/* Bouton suivant ou terminer */}
        {step < stepTotal ? (
          <TouchableOpacity
            onPress={() => {
              if (step === 3) handleSignup(); // Étape 3 → signup
              else nextStep(); // Autres → suivant
            }}
            style={[styles.nextBtn, !isStepValid() && { backgroundColor: "#A0AEC0" }]}
            disabled={!isStepValid()}
          >
            <Text style={{ color: "#fff" }}>
              {step === 3 ? is_step_3_loading ? "En cours . . ." : "Créer le compte" : "Suivant"}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleVerifyCode}
            style={[styles.finishBtn, !isStepValid() && { backgroundColor: "#A0AEC0" }]}
            disabled={!isStepValid()}
          >
            <Text style={{ color: "#fff" }}>Vérifier</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}
