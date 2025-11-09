import React, { useRef, useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { styles } from "@/utils/style";
import { API_BASE_URL } from "@/utils/constants";

interface Props {
  code: string[];
  setCode: (v: string[]) => void;
  inputs: React.MutableRefObject<Array<TextInput | null>>;
  handleCodeChange: (value: string, index: number) => void;
  isStep4Done: boolean,
  email: string;
}

const Step5Verification: React.FC<Props> = ({
  code,
  setCode,
  inputs,
  handleCodeChange,
  isStep4Done,
  email
}) => {
  const [timer, setTimer] = useState(0);
  const [isResending, setIsResending] = useState(false);

  const handleResendCode = async () => {
    if (timer > 0 || isResending) return;

    setIsResending(true);
    const response = await fetch(`${API_BASE_URL}/auth/resend-code`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }), // ✅ envoie l'email au format JSON
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Erreur lors de la réinitialisation : ${err}`);
    }

    console.log("📨 Code de vérification renvoyé !");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsResending(false);


    // Lancer le timer de 60s
    setTimer(60);
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <View style={styles.form}>
      <Text style={styles.sectionTitle}>Vérification du compte</Text>
      {isStep4Done ? (
        <Text style={[styles.subtitle, { color: "green", fontWeight: "bold" }]}>
          Un code de vérification à 6 chiffres a été envoyé dans votre boîte mail.
        </Text>
      ) : (
        <Text style={[styles.subtitle, { color: "red", fontWeight: "bold" }]}>
          Veuillez compléter l'étape précédente avant de continuer.
        </Text>
      )}

      <TouchableOpacity onPress={handleResendCode} disabled={timer > 0 || isResending}>
        <Text
          style={[
            styles.subtitle,
            { color: timer > 0 ? "gray" : "#007BFF", fontWeight: "bold" },
          ]}
        >
          {isResending
            ? "Envoi en cours..."
            : timer > 0
              ? `Renvoyer dans ${timer}s`
              : "Renvoyer le code"}
        </Text>
      </TouchableOpacity>

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
  );
};

export default Step5Verification;
