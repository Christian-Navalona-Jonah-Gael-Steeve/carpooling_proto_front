import { Role } from "@/lib/types/user.types";
import { FC } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface IRoleModalProps {
  role: string;
  visible: boolean;
  setRole: React.Dispatch<React.SetStateAction<Role>>;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

const RoleModal: FC<IRoleModalProps> = ({
  role,
  visible,
  setRole,
  setVisible,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => setVisible(false)}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Choisir un rôle</Text>
          <View style={styles.modalRow}>
            <TouchableOpacity
              style={[
                styles.roleBtn,
                role === "driver" && styles.roleBtnActive,
              ]}
              onPress={() => {
                setRole("driver");
                setVisible(false);
              }}
            >
              <Text
                style={[
                  styles.roleTxt,
                  role === "driver" && styles.roleTxtActive,
                ]}
              >
                Conducteur
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.roleBtn,
                role === "passenger" && styles.roleBtnActive,
              ]}
              onPress={() => {
                setRole("passenger");
                setVisible(false);
              }}
            >
              <Text
                style={[
                  styles.roleTxt,
                  role === "passenger" && styles.roleTxtActive,
                ]}
              >
                Passager
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  roleBtn: {
    backgroundColor: "#1f2937",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  roleBtnActive: { backgroundColor: "#22cc66" },
  roleTxt: { color: "#cbd5e1", fontWeight: "700" },
  roleTxtActive: { color: "#000" },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCard: {
    backgroundColor: "#0b1220",
    padding: 16,
    borderRadius: 14,
    width: "85%",
  },
  modalTitle: {
    color: "#fff",
    fontWeight: "700",
    marginBottom: 12,
    fontSize: 16,
  },
  modalRow: { flexDirection: "row", gap: 10 },
});

export default RoleModal;
