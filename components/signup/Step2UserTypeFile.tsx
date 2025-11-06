import React from "react";
import { FontAwesome5 } from "@expo/vector-icons";
import { FileType, UserType } from "@/utils/type";
import { styles } from "@/utils/style";

import {
  Text,
  TouchableOpacity,
  View,
  Image,
} from "react-native";

interface Props {
  userType: UserType | null;
  setUserType: (v: UserType) => void;
  file: FileType | null;
  setFile: (f: FileType) => void;
  pickFile: () => Promise<void>;
}

const Step2UserTypeAndFiles: React.FC<Props> = ({ userType, setUserType, file, setFile, pickFile }) => {

  return (
    <View style={styles.userTypeContainer}>
      <Text style={styles.sectionTitle}>Type de profil * </Text>
      <View style={styles.userTypeButtons}>
        <TouchableOpacity
          style={[
            styles.userTypeButton,
            userType === "PASSENGER" && styles.userTypeButtonActive,
          ]}
          onPress={() => setUserType("PASSENGER")}
        >
          <FontAwesome5
            name="user"
            size={24}
            color={userType === "PASSENGER" ? "#FFFFFF" : "#6B7280"}
          />
          <Text
            style={[
              styles.userTypeText,
              userType === "PASSENGER" && styles.userTypeTextActive,
            ]}
          >
            Passager
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.userTypeButton,
            userType === "DRIVER" && styles.userTypeButtonActive,
          ]}
          onPress={() => setUserType("DRIVER")}
        >
          <FontAwesome5
            name="car-side"
            size={24}
            color={userType === "DRIVER" ? "#FFFFFF" : "#6B7280"}
          />
          <Text
            style={[
              styles.userTypeText,
              userType === "DRIVER" && styles.userTypeTextActive,
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
  );
};

export default Step2UserTypeAndFiles;
