import { TripResponse } from "@/lib/api/trips.service";
import { fmtDate, fmtTime } from "@/lib/utils/date-format";
import { FC, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface IDriverTripsProps {
  ownActiveTrips: TripResponse[];
  focusTripPath: (trip: TripResponse) => void;
  openPublish: () => void;
  onOwnTripPress: (trip: TripResponse) => void;
}

export const DriverTrips: FC<IDriverTripsProps> = ({
  openPublish,
  ownActiveTrips,
  focusTripPath,
  onOwnTripPress,
}) => {
  const [myTripsOpen, setMyTripsOpen] = useState(false);
  return (
    <View style={styles.publishBar}>
      <TouchableOpacity style={styles.publishBtn} onPress={openPublish}>
        <Text style={{ color: "#000", fontWeight: "700" }}>
          Publier ce trajet
        </Text>
      </TouchableOpacity>

      {/* Accordéon Mes trajets actifs */}
      <View style={styles.accordion}>
        <TouchableOpacity
          onPress={() => setMyTripsOpen((v) => !v)}
          style={styles.accordionHeader}
        >
          <Text style={styles.myTripsTitle}>Mes trajets actifs</Text>
          <Text style={{ color: "#93c5fd", fontWeight: "700" }}>
            {myTripsOpen ? "Masquer" : "Afficher"}
          </Text>
        </TouchableOpacity>
        {myTripsOpen && (
          <View style={{ gap: 8 }}>
            {ownActiveTrips.map((t, i) => (
              <View key={t.id} style={styles.myTripRow}>
                <Text numberOfLines={1} style={styles.myTripLabel}>
                  #{i + 1} • {fmtDate(t.departureAt)} {fmtTime(t.departureAt)}
                  {(t as any).arrivalAt
                    ? ` → ${fmtTime((t as any).arrivalAt)}`
                    : ""}
                </Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TouchableOpacity
                    style={styles.viewBtn}
                    onPress={() => focusTripPath(t)}
                  >
                    <Text style={{ color: "#000", fontWeight: "700" }}>
                      👁️
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.closeBtn}
                    onPress={() => onOwnTripPress(t)}
                  >
                    <Text style={styles.closeBtnTxt}>Fermer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {ownActiveTrips.length === 0 && (
              <Text style={{ color: "#cbd5e1" }}>Aucun trajet en cours.</Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  publishBar: {
    position: "absolute",
    bottom: 12,
    left: 16,
    right: 16,
    gap: 10,
  },
  publishBtn: {
    backgroundColor: "#22cc66",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  accordion: { backgroundColor: "#0b1220", padding: 10, borderRadius: 12 },
  accordionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  myTripsTitle: { color: "#fff", fontWeight: "700" },
  myTripRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  myTripLabel: { color: "#cbd5e1", flex: 1 },
  viewBtn: { backgroundColor: "#93c5fd", padding: 10, borderRadius: 10 },
  closeBtn: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  closeBtnTxt: { color: "#fff", fontWeight: "700" },
});
