import { TripResponse } from "@/lib/api/trips.service";
import { fmtDateTime, fmtTime } from "@/lib/utils/date-format";
import { FC } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface CloseTripModalProps {
  closeModalTrip: TripResponse | null;
  setCloseModalTrip: React.Dispatch<React.SetStateAction<TripResponse | null>>;
  focusTripPath: (trip: TripResponse) => void;
  handleCloseTrip: () => void;
}

const CloseTripModal: FC<CloseTripModalProps> = ({
  handleCloseTrip,
  focusTripPath,
  closeModalTrip,
  setCloseModalTrip,
}) => {
  return (
    <Modal
      visible={!!closeModalTrip}
      transparent
      animationType="fade"
      onRequestClose={() => setCloseModalTrip(null)}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Fermer ce trajet ?</Text>
          <Text style={styles.sub}>
            Départ {fmtDateTime(closeModalTrip?.departureAt)}
            {(closeModalTrip as any)?.arrivalAt
              ? ` • Arrivée ${fmtTime((closeModalTrip as any).arrivalAt)}`
              : ""}
          </Text>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
            <TouchableOpacity
              style={[styles.closeBtn, { flex: 1 }]}
              onPress={handleCloseTrip}
            >
              <Text style={styles.closeBtnTxt}>Fermer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.publishBtn, { flex: 1 }]}
              onPress={() => {
                if (closeModalTrip) focusTripPath(closeModalTrip);
                setCloseModalTrip(null);
              }}
            >
              <Text style={{ color: "#000", fontWeight: "700" }}>Voir</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  publishBtn: {
    backgroundColor: "#22cc66",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  closeBtn: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  closeBtnTxt: { color: "#fff", fontWeight: "700" },
  sub: { color: "#cbd5e1", marginTop: 2 },

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
});

export default CloseTripModal;
