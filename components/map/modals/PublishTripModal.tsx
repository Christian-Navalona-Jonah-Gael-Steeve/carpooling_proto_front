import React, { FC, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { usePublishTrip } from "@/hooks/maps/usePublishTrip";
import { createTrip, LatLngDto, TripResponse } from "@/lib/api/trips.service";
import { Coord } from "@/lib/types/coord.types";
import { toLngLatPath } from "@/lib/utils/coords.utils";
import { toIsoForTodayOrTomorrow } from "@/lib/utils/date-format";

interface IPublishTripModal {
  activeTrips: TripResponse[];
  publishModal: boolean;
  driverId: string;
  start: Coord | null;
  end: Coord | null;
  myPath: Coord[];
  willOverlap: (
    depISO: string,
    arrISO: string,
    trips: TripResponse[],
    userId: string
  ) => boolean;
  setActiveTrips: React.Dispatch<React.SetStateAction<TripResponse[]>>;
  setPublishModal: React.Dispatch<React.SetStateAction<boolean>>;
  initialMode?: "planned" | "immediate";
}

export const PublishTripModal: FC<IPublishTripModal> = ({
  activeTrips,
  driverId,
  publishModal,
  start,
  end,
  myPath,
  setActiveTrips,
  setPublishModal,
  willOverlap,
  initialMode,
}) => {
  const [mode, setMode] = useState<"planned" | "immediate" | null>(null);
  const [leaveInMin, setLeaveInMin] = useState<number>(10);

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

  const leaveOptions = useMemo(() => [5, 10, 15, 20, 30, 45, 60], []);

  // Quand le modal est ouvert avec un mode pré-sélectionné
  useEffect(() => {
    if (publishModal && initialMode) {
      setMode(initialMode);
    }
    if (!publishModal) {
      // reset simple quand on ferme
      setMode(initialMode ?? null);
    }
  }, [publishModal, initialMode]);

  const handlePublish = async () => {
    if (!start || !end) {
      Alert.alert("Info", "Point de départ et/ou d'arrivée manquant.");
      return;
    }

    const base = new Date();
    let depISO: string;
    let arrISO: string | undefined;

    if (mode === "immediate") {
      // Trajet non planifié : départ dans X minutes
      const leaveAt = new Date(base.getTime() + leaveInMin * 60 * 1000);
      depISO = leaveAt.toISOString();
      arrISO = undefined;
    } else {
      // Par défaut ou "planned" ⇒ trajet planifié
      const dep = toIsoForTodayOrTomorrow(base, depHour, depMin);
      const arr = toIsoForTodayOrTomorrow(
        base,
        arrHour,
        arrMin,
        new Date(dep)
      );

      if (willOverlap(dep, arr, activeTrips, driverId)) {
        Alert.alert(
          "Conflit horaire",
          "Vous avez déjà un trajet actif qui chevauche cet intervalle. Choisissez d'autres horaires."
        );
        return;
      }

      depISO = dep;
      arrISO = arr;
    }

    try {
      const payload: any = {
        driverId,
        title: "Trajet conducteur",
        start: { lat: start.latitude, lng: start.longitude } as LatLngDto,
        end: { lat: end.latitude, lng: end.longitude } as LatLngDto,
        path: toLngLatPath(myPath),
        seats,
        priceMga: 3000,
        departureAt: depISO,
      };

      if (arrISO) {
        payload.arrivalAt = arrISO;
      }

      if (mode === "immediate") {
        payload.immediateInMinutes = leaveInMin;
      }

      const saved = await createTrip(payload);

      setActiveTrips((prev) => [saved, ...prev]);
      setPublishModal(false);
      Alert.alert(
        "Publié",
        mode === "immediate"
          ? "Trajet non-planifié publié. Les passagers à proximité seront notifiés."
          : "Trajet planifié publié."
      );
    } catch (e) {
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

          {/* Choix du type de trajet (caché si initialMode est fourni) */}
          {!initialMode && (
            <View style={{ marginBottom: 8 }}>
              <Text style={styles.label}>Choisissez le type de trajet</Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  style={[
                    styles.pill,
                    { paddingHorizontal: 16, paddingVertical: 10 },
                    mode === "planned" && styles.pillActive,
                  ]}
                  onPress={() => setMode("planned")}
                >
                  <Text
                    style={[
                      styles.pillTxt,
                      mode === "planned" && styles.pillTxtActive,
                    ]}
                  >
                    Planifié
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.pill,
                    { paddingHorizontal: 16, paddingVertical: 10 },
                    mode === "immediate" && styles.pillActive,
                  ]}
                  onPress={() => setMode("immediate")}
                >
                  <Text
                    style={[
                      styles.pillTxt,
                      mode === "immediate" && styles.pillTxtActive,
                    ]}
                  >
                    Non-planifié
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {mode === "immediate" && (
            <View style={styles.rowBetween}>
              <Text style={styles.label}>Départ dans</Text>
              <View style={styles.selectRow}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {leaveOptions.map((m) => (
                    <TouchableOpacity
                      key={`leave-${m}`}
                      style={[
                        styles.pill,
                        leaveInMin === m && styles.pillActive,
                      ]}
                      onPress={() => setLeaveInMin(m)}
                    >
                      <Text
                        style={[
                          styles.pillTxt,
                          leaveInMin === m && styles.pillTxtActive,
                        ]}
                      >
                        {m} min
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          )}

          {mode === "planned" && (
            <>
              <View style={styles.rowBetween}>
                <Text style={styles.label}>Heure départ</Text>
                <View style={styles.selectRow}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                  >
                    {hours.map((h) => (
                      <TouchableOpacity
                        key={`dep-h-${h}`}
                        style={[
                          styles.pill,
                          depHour === h && styles.pillActive,
                        ]}
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
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                  >
                    {mins.map((m) => (
                      <TouchableOpacity
                        key={`dep-m-${m}`}
                        style={[
                          styles.pill,
                          depMin === m && styles.pillActive,
                        ]}
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
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                  >
                    {hours.map((h) => (
                      <TouchableOpacity
                        key={`arr-h-${h}`}
                        style={[
                          styles.pill,
                          arrHour === h && styles.pillActive,
                        ]}
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
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                  >
                    {mins.map((m) => (
                      <TouchableOpacity
                        key={`arr-m-${m}`}
                        style={[
                          styles.pill,
                          arrMin === m && styles.pillActive,
                        ]}
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
            </>
          )}

          {/* Places dispo : utile pour les deux modes */}
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
              onPress={handlePublish}
            >
              <Text style={{ color: "#000", fontWeight: "700" }}>Publier</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.closeBtn,
                { flex: 1, backgroundColor: "#334155" },
              ]}
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
  modalRow: {
    flexDirection: "row",
    gap: 10,
  },
  rowBetween: {
    marginTop: 4,
  },
  label: {
    color: "#cbd5e1",
    marginBottom: 6,
  },
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
  pillActive: {
    backgroundColor: "#22cc66",
  },
  pillTxt: {
    color: "#cbd5e1",
    fontWeight: "700",
  },
  pillTxtActive: {
    color: "#000",
  },
  seatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stepBtn: {
    backgroundColor: "#1f2937",
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  stepTxt: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  seatTxt: {
    color: "#fff",
    fontWeight: "700",
    minWidth: 28,
    textAlign: "center",
  },
});
