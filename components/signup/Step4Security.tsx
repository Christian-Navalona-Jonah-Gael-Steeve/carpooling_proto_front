import { styles } from "@/utils/style";
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView } from "react-native";

interface Props {
  values: {
    password: string;
    confirmPassword: string;
  };
  setFieldValue: (field: string, value: any) => void;
}

const Step4Security: React.FC<Props> = ({ values, setFieldValue }) => {
  return (
    <KeyboardAvoidingView>
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
    </KeyboardAvoidingView>
  );
};

export default Step4Security;
