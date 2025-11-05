// app/(tabs)/maps.tsx
import {
  COVERAGE_THRESHOLD,
  INITIAL_REGION,
  PROXIMITY_METERS,
} from "@/constants/geolocation.constants";
import { useAuth } from "@/contexts/auth.context";
import { geocode } from "@/lib/api/geocode.service";
import { createRideRequest } from "@/lib/api/ride-requests.services";
import {
  LatLngDto,
  TripMatchResponse,
  TripResponse,
  closeTrip,
  createTrip,
  listTrips,
  searchTrips,
} from "@/lib/api/trips.service";
import * as Location from "expo-location";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type RNLatLng = { latitude: number; longitude: number };
type Role = "driver" | "passenger";

const DRIVER_ID = "11111111-1111-1111-1111-111111111111";

function toLngLatPath(coords: RNLatLng[]): [number, number][] {
  return coords.map((c) => [c.longitude, c.latitude]);
}
const shortId = (id?: string) => (id ? id.slice(0, 8) : "—");

// ---- formatteurs simples
const fmtTime = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";
const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString() : "—";
const fmtDateTime = (iso?: string | null) => `${fmtDate(iso)} • ${fmtTime(iso)}`;

// ---- fabrique ISO à partir d'une date de référence + (h, m)
function toIsoForTodayOrTomorrow(base: Date, h: number, m: number, after?: Date) {
  const d = new Date(base);
  d.setHours(h, m, 0, 0);
  if (after && d <= after) {
    // si arrivée choisie avant départ, pousse au lendemain
    d.setDate(d.getDate() + 1);
  }
  return d.toISOString();
}

async function fetchRoute(o: RNLatLng, d: RNLatLng): Promise<RNLatLng[]> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${o.longitude},${o.latitude};${d.longitude},${d.latitude}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const json = await res.json();
    if (json?.routes?.[0]?.geometry?.coordinates) {
      return json.routes[0].geometry.coordinates.map(
        ([lng, lat]: [number, number]) => ({ latitude: lat, longitude: lng }),
      );
    }
  } catch { }
  return [o, d];
}

export default function MapsScreen() {
  const mapRef = useRef<any>(null);

  // ---- état conducteur (tracé local)
  const [start, setStart] = useState<RNLatLng | null>(null);
  const [end, setEnd] = useState<RNLatLng | null>(null);
  const [myPath, setMyPath] = useState<RNLatLng[]>([]);

  // ---- trajets BD (toujours visibles tant que non fermés)
  const [activeTrips, setActiveTrips] = useState<TripResponse[]>([]);

  // ---- suggestions
  const [matches, setMatches] = useState<TripMatchResponse[]>([]);
  const [showSheet, setShowSheet] = useState<boolean>(true);
  const [isSearching, setIsSearching] = useState(false);

  // ---- recherche destination (passager)
  const [query, setQuery] = useState("");
  const [geoRes, setGeoRes] = useState<any[]>([]);
  const [mapCenter, setMapCenter] = useState<RNLatLng>({
    latitude: INITIAL_REGION.latitude,
    longitude: INITIAL_REGION.longitude,
  });

  // ---- rôles
  const { user } = useAuth();
  const userId = user?.uid ?? DRIVER_ID;
  const userRoles: string[] = Array.isArray((user as any)?.roles)
    ? ((user as any).roles as string[])
    : []; // p.ex. ["DRIVER","PASSENGER"]
  const hasDriver = userRoles.includes("DRIVER");
  const hasPassenger = userRoles.includes("PASSENGER");

  const [role, setRole] = useState<Role>(() => {
    if (hasDriver && !hasPassenger) return "driver";
    if (!hasDriver && hasPassenger) return "passenger";
    return "passenger";
  });
  const [roleModal, setRoleModal] = useState<boolean>(hasDriver && hasPassenger);

  // ---- modals (publication & fermeture)
  const [publishModal, setPublishModal] = useState(false);
  const [closeModalTrip, setCloseModalTrip] = useState<TripResponse | null>(null);

  // ---- champs publication (sélecteurs)
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const mins = [0, 5, 10, 15, 20, 30, 40, 45, 50, 55];
  const [depHour, setDepHour] = useState<number>(new Date().getHours());
  const [depMin, setDepMin] = useState<number>(0);
  const [arrHour, setArrHour] = useState<number>((new Date().getHours() + 1) % 24);
  const [arrMin, setArrMin] = useState<number>(0);
  const [seats, setSeats] = useState<number>(3);

  // Map (mobile only)
  const Maps = useMemo(
    () => (Platform.OS === "web" ? null : require("react-native-maps")),
    [],
  );
  const MapView = Maps?.default;
  const Marker = Maps?.Marker;
  const Polyline = Maps?.Polyline;

  // ---- chargement trajets actifs + polling 20s
  useEffect(() => {
    let mounted = true;
    const pull = async () => {
      try {
        const list = await listTrips();
        if (mounted) setActiveTrips(list);
      } catch { }
    };
    pull();
    const id = setInterval(pull, 20000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  // ---- helper: destination depuis la saisie (pas de recherche si < 3 lettres)
  const confirmDestinationFromQuery = async (): Promise<RNLatLng | null> => {
    if (end) return end;
    const q = (query || "").trim();
    if (q.length < 3) return null; // <= ne géocode pas si pas assez de lettres
    try {
      const results = await geocode(q);
      if (results && results.length > 0) {
        const best = results[0];
        const dest = { latitude: parseFloat(best.lat), longitude: parseFloat(best.lon) };
        setEnd(dest);
        if (start && role === "driver") {
          const p = await fetchRoute(start, dest);
          setMyPath(p);
        }
        return dest;
      }
    } catch { }
    return null;
  };

  // ---- interactions carte (driver only)
  const onLongPress = async (e: any) => {
    if (role === "passenger") return; // un passager ne trace pas
    const c = e.nativeEvent.coordinate as RNLatLng;
    if (!start) {
      setStart(c); setEnd(null); setMyPath([]); setMatches([]);
    } else if (!end) {
      setEnd(c); const p = await fetchRoute(start, c); setMyPath(p); setMatches([]);
    } else {
      setStart(c); setEnd(null); setMyPath([]); setMatches([]);
    }
  };

  // ---- ouverture du popup publier (driver)
  const openPublish = () => {
    if (role !== "driver") return;
    if (!start || !end || myPath.length < 2) {
      Alert.alert("Info", "Trace d’abord le départ et l’arrivée (appuis longs).");
      return;
    }
    setPublishModal(true);
  };

  // ---- vérif chevauchement des trajets du même conducteur
  const willOverlap = (depISO: string, arrISO: string) => {
    const dep = new Date(depISO).getTime();
    const arr = new Date(arrISO).getTime();
    const mine = activeTrips.filter((t) => t.driver.uid === userId);
    for (const t of mine) {
      const tDep = t.departureAt ? new Date(t.departureAt).getTime() : NaN;
      const tArr = (t as any).arrivalAt ? new Date((t as any).arrivalAt).getTime() : NaN;
      if (!isNaN(tDep) && !isNaN(tArr)) {
        // chevauchement si [dep,arr] intersecte [tDep,tArr]
        const overlap = dep < tArr && arr > tDep;
        if (overlap) return true;
      }
    }
    return false;
  };

  // ---- publier (driver) après saisie modal
  const submitPublish = async () => {
    const base = new Date();
    const depISO = toIsoForTodayOrTomorrow(base, depHour, depMin);
    const arrISO = toIsoForTodayOrTomorrow(base, arrHour, arrMin, new Date(depISO));

    // anti-chevauchement
    if (willOverlap(depISO, arrISO)) {
      Alert.alert(
        "Conflit horaire",
        "Vous avez déjà un trajet actif qui chevauche cet intervalle. Choisissez d’autres horaires."
      );
      return;
    }

    const payload = {
      driverId: userId,
      title: "Trajet conducteur",
      start: { lat: start!.latitude, lng: start!.longitude } as LatLngDto,
      end: { lat: end!.latitude, lng: end!.longitude } as LatLngDto,
      path: toLngLatPath(myPath),
      seats,
      priceMga: 3000,
      departureAt: depISO,
      arrivalAt: arrISO, // ⚠️ assure-toi que le back accepte ce champ
    };

    try {
      const saved = await createTrip(payload);
      setActiveTrips((prev) => [saved, ...prev]);
      setPublishModal(false);
      Alert.alert("Publié", "Trajet diffusé (reste visible jusqu’à fermeture).");
    } catch {
      Alert.alert("Erreur", "Publication échouée.");
    }
  };

  // ---- clic sur un trajet du conducteur -> popup fermeture
  const onOwnTripPress = (t: TripResponse) => {
    if (t.driver.uid !== userId) return;
    setCloseModalTrip(t);
  };

  const doCloseTrip = async () => {
    if (!closeModalTrip) return;
    try {
      const res = await closeTrip(closeModalTrip.id);
      setActiveTrips((L) => L.filter((t) => t.id !== res.id));
      setMatches((M) => M.filter((m) => m.trip.id !== res.id));
      setCloseModalTrip(null);
    } catch (e) {
      Alert.alert("Erreur", "Fermeture impossible pour le moment.");
      console.log("Close trip error:", (e as Error).message);
    }
  };

  // ⚠️ NE PAS MODIFIER : ta fonction existante
  const requestCarpool = async (tripId: string) => {
    if (!start || !end) return;
    await createRideRequest({
      tripId,
      start: { lat: start.latitude, lng: start.longitude },
      end: { lat: end.latitude, lng: end.longitude },
      driverId: matches.find((m) => m.trip.id === tripId)?.trip.driver.uid,
      userId: user?.uid,
    });
    Alert.alert("Envoyé", "Demande transmise au conducteur.");
  };

  // focus trajet
  const focusTripPath = (trip: TripResponse) => {
    if (!mapRef.current || !trip?.path?.length) return;
    const coords = trip.path.map((p) => ({ latitude: p.lat, longitude: p.lng }));
    try {
      mapRef.current.fitToCoordinates(coords, {
        edgePadding: { top: 80, left: 50, right: 50, bottom: 120 },
        animated: true,
      });
    } catch { }
  };

  // find suggestions (passager)
  const findSuggestions = async () => {
    // N’autoriser la recherche que si destination fixée OU au moins 3 lettres tapées
    let targetEnd: RNLatLng | null = end;
    if (!targetEnd) {
      if ((query || "").trim().length < 3) {
        Alert.alert("Info", "Tape au moins 3 lettres ou sélectionne une destination.");
        return;
      }
      targetEnd = await confirmDestinationFromQuery();
      if (!targetEnd) {
        Alert.alert("Info", "Destination introuvable. Réessaie avec un autre libellé.");
        return;
      }
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission", "La localisation est requise pour la recherche.");
      return;
    }
    setIsSearching(true);
    try {
      const pos = await Location.getCurrentPositionAsync({});
      const current: LatLngDto = { lat: pos.coords.latitude, lng: pos.coords.longitude };

      const res = await searchTrips({
        start: current, // côté passager => start = position courante
        end: { lat: targetEnd.latitude, lng: targetEnd.longitude },
        current,
        radiusMeters: PROXIMITY_METERS,
        minCoverage: COVERAGE_THRESHOLD,
        limit: 20,
      } as any);

      setMatches(res);
      setShowSheet(true);

      if (!res || res.length === 0) {
        Alert.alert("Avertissement", "Aucune suggestion trouvée à proximité.");
      } else if (res.length === 1) {
        focusTripPath(res[0].trip);
      }
    } catch {
      Alert.alert("Avertissement", "Impossible d’obtenir des suggestions pour le moment.");
    } finally {
      setIsSearching(false);
    }
  };

  // on submit (entrée clavier)
  const onSubmitDestination = async () => {
    if (role !== "passenger") return;
    if ((query || "").trim().length < 3 && !end) {
      Alert.alert("Info", "Tape au moins 3 lettres ou sélectionne une destination.");
      return;
    }
    const dest = await confirmDestinationFromQuery();
    if (dest) await findSuggestions();
  };

  // sélectionner un résultat géocodé
  const onPickGeo = async (g: any) => {
    setQuery(g.display_name); setGeoRes([]);
    const c = { latitude: parseFloat(g.lat), longitude: parseFloat(g.lon) };
    setEnd(c);
    // le passager ne trace pas ; le driver peut tracer s’il veut (mais ici role=passenger)
  };

  if (Platform.OS === "web") {
    return (
      <View style={styles.center}>
        <Text>Carte indisponible sur le web.</Text>
      </View>
    );
  }

  const ownActiveTrips = activeTrips.filter((t) => t.driver.uid === userId);
  const [myTripsOpen, setMyTripsOpen] = useState(false);

  return (
    <View style={styles.container}>
      {/* ---- Modale choix rôle (si double rôle) */}
      <Modal visible={roleModal} transparent animationType="fade" onRequestClose={() => setRoleModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Choisir un rôle</Text>
            <View style={styles.modalRow}>
              <TouchableOpacity
                style={[styles.roleBtn, role === "driver" && styles.roleBtnActive]}
                onPress={() => { setRole("driver"); setRoleModal(false); }}
              >
                <Text style={[styles.roleTxt, role === "driver" && styles.roleTxtActive]}>Conducteur</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleBtn, role === "passenger" && styles.roleBtnActive]}
                onPress={() => { setRole("passenger"); setRoleModal(false); }}
              >
                <Text style={[styles.roleTxt, role === "passenger" && styles.roleTxtActive]}>Passager</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ---- Modale publier (sélecteurs heure/sièges) */}
      <Modal visible={publishModal} transparent animationType="slide" onRequestClose={() => setPublishModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.publishCard}>
            <Text style={styles.modalTitle}>Publier ce trajet</Text>

            <View style={styles.rowBetween}>
              <Text style={styles.label}>Heure départ</Text>
              <View style={styles.selectRow}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {hours.map((h) => (
                    <TouchableOpacity key={`dep-h-${h}`} style={[styles.pill, depHour === h && styles.pillActive]} onPress={() => setDepHour(h)}>
                      <Text style={[styles.pillTxt, depHour === h && styles.pillTxtActive]}>{h.toString().padStart(2, "0")}h</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {mins.map((m) => (
                    <TouchableOpacity key={`dep-m-${m}`} style={[styles.pill, depMin === m && styles.pillActive]} onPress={() => setDepMin(m)}>
                      <Text style={[styles.pillTxt, depMin === m && styles.pillTxtActive]}>{m.toString().padStart(2, "0")}</Text>
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
                    <TouchableOpacity key={`arr-h-${h}`} style={[styles.pill, arrHour === h && styles.pillActive]} onPress={() => setArrHour(h)}>
                      <Text style={[styles.pillTxt, arrHour === h && styles.pillTxtActive]}>{h.toString().padStart(2, "0")}h</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {mins.map((m) => (
                    <TouchableOpacity key={`arr-m-${m}`} style={[styles.pill, arrMin === m && styles.pillActive]} onPress={() => setArrMin(m)}>
                      <Text style={[styles.pillTxt, arrMin === m && styles.pillTxtActive]}>{m.toString().padStart(2, "0")}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.rowBetween}>
              <Text style={styles.label}>Places disponibles</Text>
              <View style={styles.seatRow}>
                <TouchableOpacity style={styles.stepBtn} onPress={() => setSeats(Math.max(1, seats - 1))}><Text style={styles.stepTxt}>−</Text></TouchableOpacity>
                <Text style={styles.seatTxt}>{seats}</Text>
                <TouchableOpacity style={styles.stepBtn} onPress={() => setSeats(Math.min(7, seats + 1))}><Text style={styles.stepTxt}>＋</Text></TouchableOpacity>
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
              <TouchableOpacity style={[styles.publishBtn, { flex: 1 }]} onPress={submitPublish}>
                <Text style={{ color: "#000", fontWeight: "700" }}>Publier</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.closeBtn, { flex: 1, backgroundColor: "#334155" }]} onPress={() => setPublishModal(false)}>
                <Text style={{ color: "#fff", fontWeight: "700" }}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ---- Modale fermeture trajet */}
      <Modal visible={!!closeModalTrip} transparent animationType="fade" onRequestClose={() => setCloseModalTrip(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Fermer ce trajet ?</Text>
            <Text style={styles.sub}>
              Départ {fmtDateTime(closeModalTrip?.departureAt)}{(closeModalTrip as any)?.arrivalAt ? ` • Arrivée ${fmtTime((closeModalTrip as any).arrivalAt)}` : ""}
            </Text>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
              <TouchableOpacity style={[styles.closeBtn, { flex: 1 }]} onPress={doCloseTrip}>
                <Text style={styles.closeBtnTxt}>Fermer</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.publishBtn, { flex: 1 }]} onPress={() => { if (closeModalTrip) focusTripPath(closeModalTrip); setCloseModalTrip(null); }}>
                <Text style={{ color: "#000", fontWeight: "700" }}>Voir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ---- Barre de recherche (passager) */}
      <View style={styles.searchRow}>
        <TextInput
          placeholder={role === "passenger" ? "Rechercher une destination…" : "Destination (optionnel)"}
          placeholderTextColor="#999"
          style={styles.input}
          value={query}
          onSubmitEditing={onSubmitDestination}
          onChangeText={async (t) => {
            setQuery(t);
            if (t.trim().length >= 3) setGeoRes(await geocode(t));
            else setGeoRes([]);
          }}
        />
        <TouchableOpacity
          style={[styles.searchBtn, isSearching && { opacity: 0.6 }]}
          onPress={findSuggestions}
          disabled={role !== "passenger" || isSearching}
        >
          <Text style={{ color: "#000", fontWeight: "700" }}>
            {isSearching ? "Recherche…" : "Rechercher"}
          </Text>
        </TouchableOpacity>
      </View>

      {geoRes.length > 0 && (
        <View style={styles.dropdown}>
          <FlatList
            data={geoRes}
            keyExtractor={(i) => i.place_id?.toString() ?? i.lat + i.lon}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => onPickGeo(item)} style={styles.row}>
                <Text numberOfLines={2} style={{ color: "#fff" }}>{item.display_name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* ---- Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={INITIAL_REGION}
        onLongPress={onLongPress}
        onRegionChangeComplete={(r: any) => setMapCenter({ latitude: r.latitude, longitude: r.longitude })}
      >
        {/* Trajets actifs BD (cliquables pour fermeture si owner) + points start/end */}
        {activeTrips.map((t) => {
          const first = t.path[0];
          const last = t.path[t.path.length - 1];
          const isMine = t.driver.uid === userId;
          return (
            <React.Fragment key={`active-${t.id}`}>
              <Polyline
                coordinates={t.path.map((p) => ({ latitude: p.lat, longitude: p.lng }))}
                strokeWidth={isMine ? 4 : 3}
                onPress={() => isMine && onOwnTripPress(t)}
              />
              {!!first && <Marker coordinate={{ latitude: first.lat, longitude: first.lng }} title="Départ" pinColor="green" />}
              {!!last && <Marker coordinate={{ latitude: last.lat, longitude: last.lng }} title="Arrivée" pinColor="red" />}
            </React.Fragment>
          );
        })}

        {/* Mon tracé local (driver only) */}
        {role === "driver" && myPath.length > 1 && <Polyline coordinates={myPath} strokeWidth={4} />}
        {role === "driver" && start && <Marker coordinate={start} title="Départ" pinColor="green" />}
        {role === "driver" && end && <Marker coordinate={end} title="Destination" pinColor="red" />}

        {/* Suggestions (surcouche) + points start/end */}
        {matches.map((m) => {
          const first = m.trip.path[0];
          const last = m.trip.path[m.trip.path.length - 1];
          return (
            <React.Fragment key={`sugg-${m.trip.id}`}>
              <Polyline coordinates={m.trip.path.map((p) => ({ latitude: p.lat, longitude: p.lng }))} strokeWidth={4} />
              {!!first && <Marker coordinate={{ latitude: first.lat, longitude: first.lng }} title="Départ (sugg.)" pinColor="green" />}
              {!!last && <Marker coordinate={{ latitude: last.lat, longitude: last.lng }} title="Arrivée (sugg.)" pinColor="red" />}
            </React.Fragment>
          );
        })}

        {role === "passenger" && end && (
          <Marker
            coordinate={end}
            title="Ma destination"
            pinColor="#FFD700" // jaune/or
          />
        )}
      </MapView>

      {/* ---- Barre actions conducteurs */}
      {role === "driver" && (
        <View style={styles.publishBar}>
          <TouchableOpacity style={styles.publishBtn} onPress={openPublish}>
            <Text style={{ color: "#000", fontWeight: "700" }}>Publier ce trajet</Text>
          </TouchableOpacity>

          {/* Accordéon Mes trajets actifs */}
          <View style={styles.accordion}>
            <TouchableOpacity onPress={() => setMyTripsOpen((v) => !v)} style={styles.accordionHeader}>
              <Text style={styles.myTripsTitle}>Mes trajets actifs</Text>
              <Text style={{ color: "#93c5fd", fontWeight: "700" }}>{myTripsOpen ? "Masquer" : "Afficher"}</Text>
            </TouchableOpacity>
            {myTripsOpen && (
              <View style={{ gap: 8 }}>
                {ownActiveTrips.map((t, i) => (
                  <View key={t.id} style={styles.myTripRow}>
                    <Text numberOfLines={1} style={styles.myTripLabel}>
                      #{i + 1} • {fmtDate(t.departureAt)} {fmtTime(t.departureAt)}
                      {(t as any).arrivalAt ? ` → ${fmtTime((t as any).arrivalAt)}` : ""}
                    </Text>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <TouchableOpacity style={styles.viewBtn} onPress={() => focusTripPath(t)}>
                        <Text style={{ color: "#000", fontWeight: "700" }}>Voir</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.closeBtn} onPress={() => onOwnTripPress(t)}>
                        <Text style={styles.closeBtnTxt}>Fermer</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                {ownActiveTrips.length === 0 && <Text style={{ color: "#cbd5e1" }}>Aucun trajet en cours.</Text>}
              </View>
            )}
          </View>
        </View>
      )}

      {/* ---- Panneau Suggestions (fermable) */}
      {showSheet && matches.length > 0 && (
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Suggestions ({matches.length}) — r ≤ {PROXIMITY_METERS} m</Text>
            <TouchableOpacity onPress={() => setShowSheet(false)}>
              <Text style={{ color: "#93c5fd", fontWeight: "700" }}>Fermer</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={matches}
            keyExtractor={(m) => m.trip.id}
            renderItem={({ item }) => {
              const rStart = Math.round((item as any).startDist ?? (item as any).startR ?? 0);
              const rEnd = Math.round((item as any).endDist ?? (item as any).endR ?? 0);
              const driverName = item.trip.driver.firstName + " " + item.trip.driver.lastName || shortId(item.trip.driver.uid);
              return (
                <View style={styles.card}>
                  {/* plus de title, on affiche conducteur + horaires */}
                  <Text style={styles.sub}>Conducteur : {driverName}</Text>
                  <Text style={styles.sub}>
                    Départ : {fmtDate(item.trip.departureAt)} • {fmtTime(item.trip.departureAt)}
                  </Text>
                  {(item.trip as any).arrivalAt && (
                    <Text style={styles.sub}>Arrivée estimée : {fmtTime((item.trip as any).arrivalAt)}</Text>
                  )}
                  <Text style={styles.sub}>r(départ) = {rStart} m • r(arrivée) = {rEnd} m</Text>
                  <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                    <TouchableOpacity style={styles.viewBtn} onPress={() => focusTripPath(item.trip)}>
                      <Text style={{ color: "#000", fontWeight: "700" }}>Voir</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.ask} onPress={() => requestCarpool(item.trip.id)}>
                      <Text style={{ color: "#000", fontWeight: "700" }}>Demander</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
          />
        </View>
      )}

      {/* ---- Overlay chargement */}
      {isSearching && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" />
          <Text style={{ color: "#fff", marginTop: 8 }}>Recherche…</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0b0b" },
  map: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  // barre recherche
  searchRow: { position: "absolute", top: 16, left: 16, right: 16, zIndex: 5, flexDirection: "row", gap: 8 },
  input: { flex: 1, backgroundColor: "#1f2937", color: "#fff", padding: 12, borderRadius: 10 },
  searchBtn: { backgroundColor: "#22cc66", paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, alignItems: "center", justifyContent: "center" },

  dropdown: { backgroundColor: "#111827", maxHeight: 200, borderRadius: 10, marginTop: 6, padding: 6, position: "absolute", top: 64, left: 16, right: 16, zIndex: 6 },
  row: { paddingVertical: 8 },

  // zone publication & accordéon
  publishBar: { position: "absolute", bottom: 12, left: 16, right: 16, gap: 10 },
  publishBtn: { backgroundColor: "#22cc66", padding: 12, borderRadius: 12, alignItems: "center" },

  accordion: { backgroundColor: "#0b1220", padding: 10, borderRadius: 12 },
  accordionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  myTripsTitle: { color: "#fff", fontWeight: "700" },
  myTripRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  myTripLabel: { color: "#cbd5e1", flex: 1 },
  viewBtn: { backgroundColor: "#93c5fd", padding: 10, borderRadius: 10 },
  closeBtn: { backgroundColor: "#ef4444", paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10 },
  closeBtnTxt: { color: "#fff", fontWeight: "700" },

  // rôle (boutons dans la modal de sélection de rôle)
  roleBtn: { backgroundColor: "#1f2937", paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  roleBtnActive: { backgroundColor: "#22cc66" },
  roleTxt: { color: "#cbd5e1", fontWeight: "700" },
  roleTxtActive: { color: "#000" },

  // panneau suggestions
  sheet: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: "#111827", padding: 12, maxHeight: 320, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  sheetTitle: { color: "#fff", fontWeight: "700" },
  card: { backgroundColor: "#0b1220", padding: 10, borderRadius: 12, marginBottom: 8 },
  sub: { color: "#cbd5e1", marginTop: 2 },

  // modales
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center" },
  modalCard: { backgroundColor: "#0b1220", padding: 16, borderRadius: 14, width: "85%" },
  publishCard: { backgroundColor: "#0b1220", padding: 16, borderRadius: 14, width: "92%" },
  modalTitle: { color: "#fff", fontWeight: "700", marginBottom: 12, fontSize: 16 },
  modalRow: { flexDirection: "row", gap: 10 },

  // sélecteurs d'heure/min
  rowBetween: { marginTop: 4 },
  label: { color: "#cbd5e1", marginBottom: 6 },
  selectRow: { backgroundColor: "#0f172a", padding: 8, borderRadius: 10, gap: 6 },
  pill: { backgroundColor: "#1f2937", paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999, marginRight: 6 },
  pillActive: { backgroundColor: "#22cc66" },
  pillTxt: { color: "#cbd5e1", fontWeight: "700" },
  pillTxtActive: { color: "#000" },

  // sélecteur places
  seatRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepBtn: { backgroundColor: "#1f2937", width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  stepTxt: { color: "#fff", fontSize: 18, fontWeight: "700" },
  seatTxt: { color: "#fff", fontWeight: "700", minWidth: 28, textAlign: "center" },

  // overlay chargement
  loadingOverlay: { position: "absolute", left: 0, right: 0, bottom: 0, top: 0, backgroundColor: "rgba(0,0,0,0.35)", alignItems: "center", justifyContent: "center" },
});
