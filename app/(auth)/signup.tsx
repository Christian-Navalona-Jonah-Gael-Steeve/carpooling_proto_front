import { SignupPayload } from "@/lib/types/auth.types";
import Entypo from "@expo/vector-icons/Entypo";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useFormik } from "formik";
import React, { useRef, useState } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import Step1PersonalInfo from "@/components/signup/Step1PersonalInfo";

import Step2UserPhoto from "@/components/signup/Step2UserPhoto";
import Step3UserTypeAndFiles from "@/components/signup/Step3UserTypeAndFiles";
import Step4Security from "@/components/signup/Step4Security";
import Step5Verification from "@/components/signup/Step5Verification";
import { styles } from "@/utils/style";
import { FileType, Gender, UserType } from "@/utils/type";
import * as FileSystem from "expo-file-system";

export const sendSignup = async (url: string, payload: SignupPayload, file: FileType | null, pdp: FileType | null) => {
  const formData = new FormData();

  formData.append("user", JSON.stringify(payload));

  if (file) {
    let fileUri = file.uri;

    // 🧩 Si c’est une URI base64, on la convertit en fichier temporaire
    if (fileUri.startsWith("data:")) {
      const base64 = fileUri.split(",")[1];
      const path = FileSystem.cacheDirectory + (file.name || "justificatif.jpg");
      await FileSystem.writeAsStringAsync(path, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      fileUri = path; // le remplacer par un vrai fichier local
    }

    if (file) {
      formData.append("justificatif", {
        uri: file.uri,
        name: file.name || "justificatif.jpg",
        type: file.type || "image/jpeg",
      } as unknown as Blob);
    }

  }

  if (pdp) {
    let pdpUri = pdp.uri;

    // 🧩 Si c’est une URI base64, on la convertit en fichier temporaire
    if (pdpUri.startsWith("data:")) {
      const base64 = pdpUri.split(",")[1];
      const path = FileSystem.cacheDirectory + (pdp.name || "pdp.jpg");
      await FileSystem.writeAsStringAsync(path, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      pdpUri = path; // le remplacer par un vrai fichier local
    }

    if (pdp) {
      formData.append("pdp", {
        uri: pdp.uri,
        name: pdp.name || "pdp.jpg",
        type: pdp.type || "image/jpeg",
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
  const [pdp, setPdp] = useState<FileType | null>(null);
  const [file, setFile] = useState<FileType | null>(null);
  const [step, setStep] = useState(1);
  const stepTotal = 5;

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const inputs = useRef<Array<TextInput | null>>([]);
  const [is_step_4_loading, setIsStep4Loading] = useState(false);
  const [is_step_4_done, setIsStep4Done] = useState(false);
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 Mo en bytes

  const { values, setFieldValue } = useFormik<SignupPayload>({
    initialValues: {
      firstName: "",
      lastName: "",
      email: "",
      address: "",
      codePostal: "",
      city: "",
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
        return pdp !== null;
      case 3:
        return userType !== null && file !== null;
      case 4:
        return (
          values.password.trim() !== "" &&
          values.confirmPassword.trim() !== "" &&
          values.password === values.confirmPassword
        );
      case 5:
        return code.join("").length === 6;
      default:
        return true;
    }
  };

  // === VALIDATION + NAVIGATION COMBINÉE ===
  const validateAndNextStep = async () => {
    switch (step) {
      case 1:
        if (!gender) return Alert.alert("Erreur", "Veuillez sélectionner votre genre.");
        if (!values.lastName.trim()) return Alert.alert("Erreur", "Le nom est obligatoire.");
        if (!values.email.trim()) return Alert.alert("Erreur", "L'adresse e-mail est obligatoire.");
        if (!values.city.trim()) return Alert.alert("Erreur", "La ville est obligatoire.");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
          return Alert.alert("Erreur", "L'adresse e-mail n'est pas valide.");
        if (!values.phoneNumber.trim())
          return Alert.alert("Erreur", "Le numéro de téléphone est obligatoire.");
        nextStep();
        break;

      case 2:
        if (!pdp) return Alert.alert("Erreur", "Veuillez importer votre photo de profil.");
        nextStep();
        break;

      case 3:
        if (!userType) return Alert.alert("Erreur", "Veuillez sélectionner un type d'utilisateur.");
        if (!file) return Alert.alert("Erreur", "Veuillez importer un justificatif ou une photo.");
        nextStep();
        break;

      case 4:
        if (!values.password.trim())
          return Alert.alert("Erreur", "Le mot de passe est obligatoire.");
        if (!values.confirmPassword.trim())
          return Alert.alert("Erreur", "Veuillez confirmer votre mot de passe.");
        if (values.password.length < 6)
          return Alert.alert("Erreur", "Le mot de passe doit contenir au moins 6 caractères.");
        if (values.password !== values.confirmPassword)
          return Alert.alert("Erreur", "Les mots de passe ne correspondent pas.");
        await handleSignup();
        break;

      case 5:
        const codeStr = code.join("");
        if (codeStr.length !== 6)
          return Alert.alert("Erreur", "Veuillez entrer le code complet à 6 chiffres.");
        await handleVerifyCode();
        break;

      default:
        nextStep();
    }
  };

  // === FONCTIONS DE NAVIGATION ===
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));
  const nextStep = () => setStep((prev) => Math.min(prev + 1, stepTotal));

  // === FONCTION GÉNÉRIQUE POUR PICKER UNE IMAGE ===
  const pickImage = async (
    setTarget: React.Dispatch<React.SetStateAction<FileType | null>>,
    aspect: [number, number] = [4, 3],
    label: string = "fichier"
  ) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect,
        quality: 1,
      });

      if (!result.canceled) {
        const asset = result.assets[0];

        // Vérifier la taille du fichier
        let fileSize = asset.fileSize;
        if (!fileSize && asset.uri) {
          const info = await FileSystem.getInfoAsync(asset.uri);
          fileSize = info.exists ? info.size ?? 0 : 0;
        }

        if (fileSize && fileSize > MAX_FILE_SIZE) {
          Alert.alert(
            "Fichier trop volumineux",
            `Veuillez sélectionner un ${label} inférieur à ${MAX_FILE_SIZE / (1024 * 1024)} Mo.`
          );
          return;
        }

        const newFile: FileType = {
          uri: asset.uri,
          name: asset.fileName || `${label}.jpg`,
          type: asset.mimeType || "image/jpeg",
        };

        setTarget(newFile);
        console.log(`✅ ${label} choisi:`, newFile);
      }
    } catch (error) {
      console.error(`Erreur lors du choix du ${label}:`, error);
    }
  };

  const pickFile = () => pickImage(setFile, [4, 3], "justificatif");
  const picPdp = () => pickImage(setPdp, [4, 4], "photo de profil");

  // === SIGNUP ===
  const handleSignup = async () => {
    setIsStep4Loading(true);
    try {
      console.log("file -", file);
      if (!gender || !userType || !file)
        return Alert.alert("Erreur", "Veuillez compléter les étapes précédentes.");
      const signupPayload = { ...values, gender, userType };
      console.log("signupPayload", signupPayload);
      await sendSignup(`${API_BASE_URL}/auth/signup`, signupPayload, file, pdp);

      console.log("ok -------------- ");
      Alert.alert("Succès", "Inscription réussie ! Vérifiez votre email.");
      console.log("ok -------------- ", step);
      setStep(5);
      console.log("ok 5-------------- ", step);
      setIsStep4Done(true);
      setIsStep4Loading(false);
    } catch (err: any) {
      setIsStep4Done(false);
      Alert.alert("Erreur lors de l'inscription", err.message);
    }
    finally {
      setIsStep4Loading(false);
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
        <Step2UserPhoto
          pdp={pdp}
          setPdp={setPdp}
          picPdp={picPdp}
        />
      )}
      {step === 3 && (
        <Step3UserTypeAndFiles
          userType={userType}
          setUserType={setUserType}
          file={file}
          setFile={setFile}
          pickFile={pickFile}
        />
      )}
      {step === 4 && (
        <Step4Security
          values={values}
          setFieldValue={setFieldValue}
        />
      )}
      {step === 5 && (
        <Step5Verification
          code={code}
          setCode={setCode}
          inputs={inputs}
          handleCodeChange={handleCodeChange}
          isStep4Done={is_step_4_done}
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
            onPress={validateAndNextStep}
            // onPress={() => {
            //   if (step === 4) handleSignup(); // Étape 4 → signup
            //   else nextStep(); // Autres → suivant
            // }}
            style={[styles.nextBtn, !isStepValid() && { backgroundColor: "#A0AEC0" }]}
            disabled={!isStepValid()}
          >
            <Text style={{ color: "#fff" }}>
              {step === 4 ? is_step_4_loading ? "En cours . . ." : "Créer le compte" : "Suivant"}
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
