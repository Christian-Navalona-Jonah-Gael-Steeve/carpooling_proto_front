import React, { useRef, useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { styles } from "@/utils/style";

interface Props {
  code: string[];
  setCode: (v: string[]) => void;
  inputs: React.MutableRefObject<Array<TextInput | null>>;
  handleCodeChange: (value: string, index: number) => void;
}

const Step4Verification: React.FC<Props> = ({
  code,
  setCode,
  inputs,
  handleCodeChange,
}) => {
  const [timer, setTimer] = useState(0);
  const [isResending, setIsResending] = useState(false);

  const handleResendCode = async () => {
    if (timer > 0 || isResending) return;

    setIsResending(true);
    // 👉 Simule l'envoi du code (remplace par ton API réelle)
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
      <Text style={styles.subtitle}>
        Un code de vérification à 6 chiffres a été envoyé dans votre boîte mail.
      </Text>

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

export default Step4Verification;
