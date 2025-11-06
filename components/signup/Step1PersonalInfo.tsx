import React, { useRef, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { SignupPayload } from "@/lib/types/auth.types";
import { Gender } from "@/utils/type";

import { styles } from "@/utils/style";
import PhoneInput from "react-native-phone-number-input";

interface Props {
  gender: Gender | null;
  setGender: (v: Gender) => void;
  values: SignupPayload;
  setFieldValue: (field: string, value: any) => void;
}

export default function Step1PersonalInfo({ gender, setGender, values, setFieldValue }: Props) {
  // On déclare la ref comme "any" pour éviter l’erreur TS sur la méthode manquante
  const phoneInput = useRef<any>(null);
  const [phoneNumber, setPhoneNumber] = useState(values.phoneNumber || "");

  const handlePhoneChange = (formattedNumber: string) => {
    setPhoneNumber(formattedNumber);         // met à jour l'état local
    setFieldValue("phoneNumber", formattedNumber);  // met à jour le formulaire
  };

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
        <PhoneInput
          ref={phoneInput as any}
          defaultCode="MG"
          layout="first"
          // @ts-ignore
          value={phoneNumber}           // TypeScript ne connaît pas "value", mais ça fonctionne
          onChangeFormattedText={handlePhoneChange}
          containerStyle={{
            backgroundColor: "#fff",
            borderRadius: 8,
            borderWidth: 1,
            borderColor: "#ccc",
          }}
          flagButtonStyle={{
            backgroundColor: "#f5f5f5",
            borderTopLeftRadius: 8,
            borderBottomLeftRadius: 8,
          }}
          textContainerStyle={{
            backgroundColor: "#fff",
          }}
        />

      </View>
    </>
  );
}
