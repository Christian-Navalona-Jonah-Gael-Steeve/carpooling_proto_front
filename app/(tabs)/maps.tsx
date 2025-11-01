import {
  COVERAGE_THRESHOLD,
  INITIAL_REGION,
  PROXIMITY_METERS,
  R,
} from "@/constants/geolocation.constants";
import { Coord, Trip } from "@/lib/types/coord.types";
import { deg2rad, projectAlongMeters, toXY } from "@/lib/utils";
import { getRandomColor } from "@/lib/utils/generate-colors.utils";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";

/** ─────────────────────────────
 *  Types & constantes
 *  ────────────────────────────*/

// distance approx en mètres entre 2 lat/lng
function metersBetween(a: Coord, b: Coord): number {
  const lat1 = deg2rad(a.latitude),
    lat2 = deg2rad(b.latitude);
  const dLat = lat2 - lat1;
  const dLon = deg2rad(b.longitude - a.longitude);
  const x = dLon * Math.cos((lat1 + lat2) / 2) * R;
  const y = dLat * R;
  return Math.sqrt(x * x + y * y);
}

// convertit un point en XY (mètres) relatif à ref

// distance point-segment (en m) via projection en XY local
function pointToSegmentDistanceMeters(p: Coord, a: Coord, b: Coord): number {
  // repère local centré sur A
  const P = toXY(a, p);
  const A = { x: 0, y: 0 };
  const B = toXY(a, b);

  const ABx = B.x - A.x;
  const ABy = B.y - A.y;
  const APx = P.x - A.x;
  const APy = P.y - A.y;

  const ab2 = ABx * ABx + ABy * ABy || 1e-9;
  let t = (APx * ABx + APy * ABy) / ab2;
  t = Math.max(0, Math.min(1, t));

  const Cx = A.x + t * ABx;
  const Cy = A.y + t * ABy;

  const dx = P.x - Cx;
  const dy = P.y - Cy;
  return Math.sqrt(dx * dx + dy * dy);
}

// distance min point → polyline
function minDistancePointToPathMeters(p: Coord, path: Coord[]): number {
  if (path.length < 2) return Infinity;
  let min = Infinity;
  for (let i = 0; i < path.length - 1; i++) {
    const d = pointToSegmentDistanceMeters(p, path[i], path[i + 1]);
    if (d < min) min = d;
  }
  return min;
}

// score simple de coïncidence : % de points de userPath proches de candidatePath
function matchScore(
  userPath: Coord[],
  candidatePath: Coord[],
  radius = PROXIMITY_METERS
) {
  if (userPath.length < 2 || candidatePath.length < 2) return 0;
  // échantillonnage léger: 1 point sur 5 (OSRM renvoie déjà beaucoup de points)
  const samples: Coord[] = [];
  for (let i = 0; i < userPath.length; i += 5) samples.push(userPath[i]);
  if (userPath.length > 0) samples.push(userPath[userPath.length - 1]);

  let close = 0;
  for (const p of samples) {
    const d = minDistancePointToPathMeters(p, candidatePath);
    if (d <= radius) close++;
  }
  return close / samples.length; // 0..1
}

/** ─────────────────────────────
 *  App
 *  ────────────────────────────*/
export default function MapsScreen() {
  // trajet en cours (utilisateur)
  const [start, setStart] = useState<Coord | null>(null);
  const [end, setEnd] = useState<Coord | null>(null);
  const [myPath, setMyPath] = useState<Coord[]>([]);
  // trajets publiés
  const [trips, setTrips] = useState<Trip[]>([]);
  // suggestions (ids) pour mon trajet
  const [suggestedIds, setSuggestedIds] = useState<Set<string>>(new Set());

  const handleLongPress = (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate as Coord;
    if (!start) {
      setStart({ latitude, longitude, title: "Mon départ" });
      setEnd(null);
      setMyPath([]);
      setSuggestedIds(new Set());
    } else if (!end) {
      const dest = { latitude, longitude, title: "Ma destination" };
      setEnd(dest);
      fetchRoute(start, dest).then(setMyPath);
    } else {
      // recommencer: nouveau départ
      setStart({ latitude, longitude, title: "Mon départ" });
      setEnd(null);
      setMyPath([]);
      setSuggestedIds(new Set());
    }
  };

  // Récupère un polyline entre deux points (OSRM). Fallback: ligne droite.
  async function fetchRoute(o: Coord, d: Coord): Promise<Coord[]> {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${o.longitude},${o.latitude};${d.longitude},${d.latitude}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const json = await res.json();
      if (json?.routes?.[0]?.geometry?.coordinates) {
        return json.routes[0].geometry.coordinates.map(
          ([lng, lat]: [number, number]) => ({ latitude: lat, longitude: lng })
        );
      }
    } catch {}
    return [o, d];
  }

  // Publier le trajet utilisateur courant
  const publishTrip = () => {
    if (myPath.length < 2) {
      Alert.alert(
        "Info",
        "Définis d’abord départ et destination (appuis longs)."
      );
      return;
    }
    const id = `trip-${Date.now()}`;
    setTrips((prev) => [
      ...prev,
      { id, path: myPath, color: getRandomColor() },
    ]);
    // garder le trajet utilisateur pour recherche ultérieure
    Alert.alert("Publié", "Trajet publié sur la carte.");
  };

  // Trouver les trajets publiés qui “coïncident” avec mon trajet
  const findSuggestions = () => {
    if (myPath.length < 2 || !start || !end || trips.length === 0) {
      Alert.alert(
        "Info",
        "Crée ton trajet (départ + destination) et publie/affiche des trajets."
      );
      return;
    }

    const matches = new Set<string>();

    for (const t of trips) {
      // 1) Couverture (comme avant, optionnelle)
      const score = matchScore(myPath, t.path, PROXIMITY_METERS);

      // 2) Départ proche du trajet publié
      const sp = projectAlongMeters(start, t.path);
      const startNear = sp.dist <= PROXIMITY_METERS; // ex. 30 m

      // 3) Arrivée proche + même sens
      const ep = projectAlongMeters(end, t.path);
      const endNear = ep.dist <= PROXIMITY_METERS;

      // même direction: la projection de l’arrivée est APRÈS celle du départ
      const directionOk = ep.along > sp.along + 5; // +5 m de marge

      if (startNear && endNear && directionOk && score >= COVERAGE_THRESHOLD) {
        matches.add(t.id);
      }
    }

    setSuggestedIds(matches);
    Alert.alert(
      "Suggestions",
      `${matches.size} trajet(s) correspondant(s) trouvé(s).`
    );
  };

  const resetAll = () => {
    setStart(null);
    setEnd(null);
    setMyPath([]);
    setTrips([]);
    setSuggestedIds(new Set());
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={INITIAL_REGION}
        onLongPress={handleLongPress}
        toolbarEnabled={false}
      >
        {/* Trajets publiés (orange) et ceux suggérés (vert) */}
        {trips.map((t, index) => {
          const isSuggested = suggestedIds.has(t.id);
          return (
            <>
              <Polyline
                key={t.id}
                coordinates={t.path}
                strokeWidth={isSuggested ? 6 : 4}
                strokeColor={
                  isSuggested
                    ? Platform.OS === "ios"
                      ? "green"
                      : "#22CC66"
                    : Platform.OS === "ios"
                    ? "orange"
                    : t.color
                }
              />
              {/* Départ */}
              <Marker
                coordinate={t.path[0]}
                title={`Départ ${index + 1}`}
                pinColor={t.color || "orange"}
              />

              {/* Arrivée */}
              <Marker
                coordinate={t.path[t.path.length - 1]}
                title={`Arrivée ${index + 1}`}
                pinColor={t.color || "orange"}
              />
            </>
          );
        })}

        {/* Mon trajet (bleu) */}
        {myPath.length > 1 && (
          <Polyline
            coordinates={myPath}
            strokeWidth={4}
            strokeColor={Platform.OS === "ios" ? "blue" : "#3366FF"}
          />
        )}

        {start && (
          <Marker coordinate={start} title={start.title} pinColor="green" />
        )}
        {end && <Marker coordinate={end} title={end.title} pinColor="red" />}
      </MapView>

      {/* Actions */}
      <View style={styles.fabRow}>
        <TouchableOpacity style={styles.fab} onPress={publishTrip}>
          <Text style={styles.fabText}>Publier trajet</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.fab} onPress={findSuggestions}>
          <Text style={styles.fabText}>Trouver trajets</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.fabSecondary} onPress={resetAll}>
          <Text style={styles.fabTextSecondary}>Réinitialiser</Text>
        </TouchableOpacity>
      </View>

      {/* Infos */}
      <View style={styles.info}>
        {!start && <Text>👆 Appui long: choisir le départ.</Text>}
        {start && !end && <Text>👆 Appui long: choisir la destination.</Text>}
        <Text style={{ marginTop: 4 }}>
          Publiés: {trips.length} • Suggérés: {suggestedIds.size} • Rayon:{" "}
          {PROXIMITY_METERS} m
        </Text>
      </View>
    </View>
  );
}

/** ─────────────────────────────
 *  Styles
 *  ────────────────────────────*/
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111" },
  map: { flex: 1 },
  info: {
    position: "absolute",
    top: 50,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  fabRow: {
    position: "absolute",
    bottom: 30,
    alignSelf: "center",
    flexDirection: "row",
    gap: 10,
  },
  fab: {
    backgroundColor: "#0F5",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  fabSecondary: {
    backgroundColor: "#333",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  fabText: { color: "#000", fontWeight: "700" },
  fabTextSecondary: { color: "#fff", fontWeight: "700" },
});
