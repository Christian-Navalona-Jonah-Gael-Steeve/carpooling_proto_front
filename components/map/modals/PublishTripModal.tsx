import { usePublishTrip } from "@/hooks/usePublishTrip";
import { createTrip, LatLngDto, TripResponse } from "@/lib/api/trips.service";
import { Coord } from "@/lib/types/coord.types";
import { toLngLatPath } from "@/lib/utils/coords.utils";
import { toIsoForTodayOrTomorrow } from "@/lib/utils/date-format";
import { FC } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface IPublishTripModal {
  publishModal: boolean;
  driverId: string;
  start: Coord | null;
  end: Coord | null;
  myPath: Coord[];
  willOverlap: (depISO: string, arrISO: string) => boolean;
  setActiveTrips: React.Dispatch<React.SetStateAction<TripResponse[]>>;
  setPublishModal: React.Dispatch<React.SetStateAction<boolean>>;
}

export const PublishTripModal: FC<IPublishTripModal> = ({
  driverId,
  publishModal,
  start,
  end,
  myPath,
  setActiveTrips,
  setPublishModal,
  willOverlap,
}) => {
  const {
    hours,
    arrHour,
    arrMin,
    depHour,
    depMin,
    mins,
    seats,
    setArrHour,
    setArrMin,
    setDepHour,
    setDepMin,
    setSeats,
  } = usePublishTrip();

  const submitPublish = async () => {
    const base = new Date();
    const depISO = toIsoForTodayOrTomorrow(base, depHour, depMin);
    const arrISO = toIsoForTodayOrTomorrow(
      base,
      arrHour,
      arrMin,
      new Date(depISO)
    );

    // anti-chevauchement
    if (willOverlap(depISO, arrISO)) {
      Alert.alert(
        "Conflit horaire",
        "Vous avez déjà un trajet actif qui chevauche cet intervalle. Choisissez d’autres horaires."
      );
      return;
    }

    try {
      const saved = await createTrip({
        driverId,
        title: "Trajet conducteur",
        start: { lat: start!.latitude, lng: start!.longitude } as LatLngDto,
        end: { lat: end!.latitude, lng: end!.longitude } as LatLngDto,
        path: toLngLatPath(myPath),
        seats,
        priceMga: 3000,
        departureAt: depISO,
        arrivalAt: arrISO,
      });

      setActiveTrips((prev) => [saved, ...prev]);
      setPublishModal(false);
      Alert.alert(
        "Publié",
        "Trajet diffusé (reste visible jusqu’à fermeture)."
      );
    } catch {
      Alert.alert("Erreur", "Publication échouée.");
    }
  };
  return (
    <Modal
      visible={publishModal}
      transparent
      animationType="slide"
      onRequestClose={() => setPublishModal(false)}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.publishCard}>
          <Text style={styles.modalTitle}>Publier ce trajet</Text>

          <View style={styles.rowBetween}>
            <Text style={styles.label}>Heure départ</Text>
            <View style={styles.selectRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {hours.map((h) => (
                  <TouchableOpacity
                    key={`dep-h-${h}`}
                    style={[styles.pill, depHour === h && styles.pillActive]}
                    onPress={() => setDepHour(h)}
                  >
                    <Text
                      style={[
                        styles.pillTxt,
                        depHour === h && styles.pillTxtActive,
                      ]}
                    >
                      {h.toString().padStart(2, "0")}h
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {mins.map((m) => (
                  <TouchableOpacity
                    key={`dep-m-${m}`}
                    style={[styles.pill, depMin === m && styles.pillActive]}
                    onPress={() => setDepMin(m)}
                  >
                    <Text
                      style={[
                        styles.pillTxt,
                        depMin === m && styles.pillTxtActive,
                      ]}
                    >
                      {m.toString().padStart(2, "0")}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={styles.rowBetween}>
            <Text style={styles.label}>Heure arrivée estimée</Text>
            <View style={styles.selectRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {hours.map((h) => (
                  <TouchableOpacity
                    key={`arr-h-${h}`}
                    style={[styles.pill, arrHour === h && styles.pillActive]}
                    onPress={() => setArrHour(h)}
                  >
                    <Text
                      style={[
                        styles.pillTxt,
                        arrHour === h && styles.pillTxtActive,
                      ]}
                    >
                      {h.toString().padStart(2, "0")}h
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {mins.map((m) => (
                  <TouchableOpacity
                    key={`arr-m-${m}`}
                    style={[styles.pill, arrMin === m && styles.pillActive]}
                    onPress={() => setArrMin(m)}
                  >
                    <Text
                      style={[
                        styles.pillTxt,
                        arrMin === m && styles.pillTxtActive,
                      ]}
                    >
                      {m.toString().padStart(2, "0")}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={styles.rowBetween}>
            <Text style={styles.label}>Places disponibles</Text>
            <View style={styles.seatRow}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setSeats(Math.max(1, seats - 1))}
              >
                <Text style={styles.stepTxt}>−</Text>
              </TouchableOpacity>
              <Text style={styles.seatTxt}>{seats}</Text>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setSeats(Math.min(7, seats + 1))}
              >
                <Text style={styles.stepTxt}>＋</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
            <TouchableOpacity
              style={[styles.publishBtn, { flex: 1 }]}
              onPress={submitPublish}
            >
              <Text style={{ color: "#000", fontWeight: "700" }}>Publier</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.closeBtn, { flex: 1, backgroundColor: "#334155" }]}
              onPress={() => setPublishModal(false)}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>Annuler</Text>
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

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  publishCard: {
    backgroundColor: "#0b1220",
    padding: 16,
    borderRadius: 14,
    width: "92%",
  },
  modalTitle: {
    color: "#fff",
    fontWeight: "700",
    marginBottom: 12,
    fontSize: 16,
  },
  modalRow: { flexDirection: "row", gap: 10 },

  rowBetween: { marginTop: 4 },
  label: { color: "#cbd5e1", marginBottom: 6 },
  selectRow: {
    backgroundColor: "#0f172a",
    padding: 8,
    borderRadius: 10,
    gap: 6,
  },
  pill: {
    backgroundColor: "#1f2937",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    marginRight: 6,
  },
  pillActive: { backgroundColor: "#22cc66" },
  pillTxt: { color: "#cbd5e1", fontWeight: "700" },
  pillTxtActive: { color: "#000" },

  seatRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepBtn: {
    backgroundColor: "#1f2937",
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  stepTxt: { color: "#fff", fontSize: 18, fontWeight: "700" },
  seatTxt: {
    color: "#fff",
    fontWeight: "700",
    minWidth: 28,
    textAlign: "center",
  },
});
