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
  pdp: FileType | null;
  setPdp: (f: FileType) => void;
  picPdp: () => Promise<void>;
}

const Step2UserPhoto: React.FC<Props> = ({ pdp, setPdp, picPdp }) => {

  return (
    <View style={styles.userTypeContainer}>
      <Text style={styles.sectionTitle}>Photo de profil * </Text>
      <TouchableOpacity onPress={picPdp} style={styles.fileButton}>
        <Text style={{ color: "#fff" }}>
          {pdp ? "Changer la photo" : "Choisir un photo (PNG/JPEG/JPG)"}
        </Text>
      </TouchableOpacity>

      {pdp && (
        <View style={{ marginTop: 10, alignItems: "center" }}>
          {/* <Text style={{ fontStyle: "italic", color: "#555", marginBottom: 5 }}>
            {pdp.name}
          </Text> */}
          {pdp.uri && (
            <Image source={{ uri: pdp.uri }} style={styles.previewImage} resizeMode="cover" />
          )}
        </View>
      )}
    </View>
  );
};

export default Step2UserPhoto;
