import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Mode = "planned" | "immediate";

interface ChooseTripTypeModalProps {
  visible: boolean;
  onPick: (mode: Mode) => void;
  onClose: () => void;
}

const ChooseTripTypeModal: React.FC<ChooseTripTypeModalProps> = ({
  visible,
  onPick,
  onClose,
}) => {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Type de trajet</Text>
          <Text style={styles.subtitle}>Choisissez une option</Text>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
            <TouchableOpacity style={[styles.pill, styles.pillWide]} onPress={() => onPick("planned")}>
              <Text style={styles.pillTxt}>Planifié</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.pill, styles.pillWide]} onPress={() => onPick("immediate")}>
              <Text style={styles.pillTxt}>Non-planifié</Text>
            </TouchableOpacity>
          </View>
          <View style={{ marginTop: 16 }}>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={{ color: "#fff", fontWeight: "700" }}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#0b1220",
    padding: 16,
    borderRadius: 14,
    width: "92%",
  },
  title: { color: "#fff", fontWeight: "700", fontSize: 16 },
  subtitle: { color: "#cbd5e1", marginTop: 8, marginBottom: 10 },
  pill: {
    backgroundColor: "#1f2937",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
  },
  pillWide: { paddingHorizontal: 16, paddingVertical: 10 },
  pillTxt: { color: "#cbd5e1", fontWeight: "700" },
  closeBtn: {
    backgroundColor: "#334155",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
});

export default ChooseTripTypeModal;

