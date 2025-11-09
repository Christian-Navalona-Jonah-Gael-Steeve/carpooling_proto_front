import { StyleSheet, Text, View, TouchableOpacity, Modal } from "react-native";
import { useAuth } from "@/contexts/auth.context";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useState } from "react";

/**
 * Home screen component - protected tab screen
 * Displays user information and logout functionality
 */
export default function HomeScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  /**
   * Handle user logout
   */
  const confirmLogout = async () => {
    try {
      await logout();
      router.replace("/(auth)/login");
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const logoutModal = () => {
    setShowLogoutModal(true);
  };

  const closeModal = () => {
    setShowLogoutModal(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Accueil</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={logoutModal}>
          <MaterialIcons name="logout" size={24} color="#DC2626" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.welcomeText}>
          Bienvenue, {user?.firstName || 'Utilisateur'} !
        </Text>
        <Text style={styles.subtitle}>
          Vous êtes connecté à votre compte de covoiturage.
        </Text>
      </View>
      {/* MODAL DE CONFIRMATION */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Déconnexion</Text>
            <Text style={styles.modalText}>Voulez-vous vraiment déconnexion ?</Text>

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={closeModal} style={styles.cancelBtn}>
                <Text style={{ color: "#2B6CB0" }}>Non</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmLogout} style={styles.confirmBtn}>
                <Text style={{ color: "#fff" }}>Oui, Déconnecter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  title: {
    fontSize: 24,
    fontFamily: "Inter-Bold",
    color: "#111827",
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#FEF2F2",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  welcomeText: {
    fontSize: 20,
    fontFamily: "Inter-SemiBold",
    color: "#111827",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Inter-Regular",
    color: "#6B7280",
    lineHeight: 24,
  },


  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 25,
    width: "80%",
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  modalText: {
    fontSize: 15,
    color: "#555",
    textAlign: "center",
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: "#E2E8F0",
  },
  confirmBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: "#E53E3E",
  },
});
