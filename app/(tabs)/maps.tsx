import { DriverTrips } from "@/components/map/DriverTrips";
import LoadingOverlay from "@/components/map/LoadingOverlay";
import CloseTripModal from "@/components/map/modals/ClosetripModal";
import { PublishTripModal } from "@/components/map/modals/PublishTripModal";
import RoleModal from "@/components/map/modals/RoleModal";
import {
  COVERAGE_THRESHOLD,
  INITIAL_REGION,
  PROXIMITY_METERS,
} from "@/constants/geolocation.constants";
import { useAuth } from "@/contexts/auth.context";
import { useDriverMap } from "@/hooks/maps/useDriverMap";
import { geocode } from "@/lib/api/geocode.service";
import { createRideRequest } from "@/lib/api/ride-requests.services";
import {
  LatLngDto,
  TripMatchResponse,
  TripResponse,
  closeTrip,
  fetchRoute,
  listTrips,
  searchTrips,
} from "@/lib/api/trips.service";
import { Coord } from "@/lib/types/coord.types";
import { Role } from "@/lib/types/user.types";
import { fmtDate, fmtTime } from "@/lib/utils/date-format";
import { willOverlap } from "@/lib/utils/trip.utils";
import * as Location from "expo-location";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type RNLatLng = { latitude: number; longitude: number };

const DRIVER_ID = "11111111-1111-1111-1111-111111111111";

const shortId = (id?: string) => (id ? id.slice(0, 8) : "—");

export default function MapsScreen() {
  const mapRef = useRef<any>(null);

  // ---- trajets BD (toujours visibles tant que non fermés)
  const [activeTrips, setActiveTrips] = useState<TripResponse[]>([]);

  // ---- suggestions
  const [matches, setMatches] = useState<TripMatchResponse[]>([]);
  const [showSheet, setShowSheet] = useState<boolean>(true);
  const [isSearching, setIsSearching] = useState(false);
  const [visibleSuggestionId, setVisibleSuggestionId] = useState<string | null>(
    null
  );
  const [visibleDriverTripId, setVisibleDriverTripId] = useState<string | null>(
    null
  );

  // ---- recherche destination (passager)
  const [query, setQuery] = useState("");
  const [geoRes, setGeoRes] = useState<any[]>([]);
  const [mapCenter, setMapCenter] = useState<Coord>({
    latitude: INITIAL_REGION.latitude,
    longitude: INITIAL_REGION.longitude,
  });

  const [publishModal, setPublishModal] = useState(false);
  const [currentPos, setCurrentPos] = useState<Coord | null>(null);

  // ---- rôles
  const { user } = useAuth();
  const userId = user?.uid ?? DRIVER_ID;
  const userRoles: string[] = Array.isArray((user as any)?.roles)
    ? ((user as any).roles as string[])
    : [];
  const hasDriver = userRoles.includes("DRIVER");
  const hasPassenger = userRoles.includes("PASSENGER");

  const [role, setRole] = useState<Role>(() => {
    if (hasDriver && !hasPassenger) return "driver";
    if (!hasDriver && hasPassenger) return "passenger";
    return "passenger";
  });
  const [roleModal, setRoleModal] = useState<boolean>(
    hasDriver && hasPassenger
  );

  const { end, myPath, start, onLongPress, openPublish, setEnd, setMyPath } =
    useDriverMap({
      role,
      setMatches,
      setPublishModal,
    });

  // ---- modals (publication & fermeture)

  const [closeModalTrip, setCloseModalTrip] = useState<TripResponse | null>(
    null
  );

  // Map (mobile only)
  const Maps = useMemo(
    () => (Platform.OS === "web" ? null : require("react-native-maps")),
    []
  );
  const MapView = Maps?.default;
  const Marker = Maps?.Marker;
  const Polyline = Maps?.Polyline;

  // ---- position actuelle (passager)
  useEffect(() => {
    let mounted = true;
    if (role !== "passenger") return;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;
        const pos = await Location.getCurrentPositionAsync({});
        if (!mounted) return;
        setCurrentPos({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, [role]);

  // ---- chargement trajets actifs + polling 20s
  useEffect(() => {
    let mounted = true;
    const pull = async () => {
      try {
        const list = await listTrips();
        if (mounted) setActiveTrips(list);
      } catch {}
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
    if (q.length < 3) return null;
    try {
      const results = await geocode(q);
      if (results && results.length > 0) {
        const best = results[0];
        const dest = {
          latitude: parseFloat(best.lat),
          longitude: parseFloat(best.lon),
        };
        setEnd(dest);
        if (start && role === "driver") {
          const p = await fetchRoute(start, dest);
          setMyPath(p);
        }
        return dest;
      }
    } catch {}
    return null;
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
    const coords = trip.path.map((p) => ({
      latitude: p.lat,
      longitude: p.lng,
    }));
    try {
      mapRef.current.fitToCoordinates(coords, {
        edgePadding: { top: 80, left: 50, right: 50, bottom: 120 },
        animated: true,
      });
    } catch {}
  };

  // focus trajet conducteur (isole le trajet)
  const focusOwnTripPath = (trip: TripResponse) => {
    setVisibleDriverTripId(trip.id);
    focusTripPath(trip);
  };

  // find suggestions (passager)
  const findSuggestions = async () => {
    let targetEnd: RNLatLng | null = end;
    if (!targetEnd) {
      if ((query || "").trim().length < 3) {
        Alert.alert(
          "Info",
          "Tape au moins 3 lettres ou sélectionne une destination."
        );
        return;
      }
      targetEnd = await confirmDestinationFromQuery();
      if (!targetEnd) {
        Alert.alert(
          "Info",
          "Destination introuvable. Réessaie avec un autre libellé."
        );
        return;
      }
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission",
        "La localisation est requise pour la recherche."
      );
      return;
    }
    setIsSearching(true);
    try {
      const pos = await Location.getCurrentPositionAsync({});
      const current: LatLngDto = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      };
      setCurrentPos({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });

      const res = await searchTrips({
        start: current,
        end: { lat: targetEnd.latitude, lng: targetEnd.longitude },
        current,
        radiusMeters: PROXIMITY_METERS,
        minCoverage: COVERAGE_THRESHOLD,
        limit: 20,
      } as any);

      setMatches(res);
      setVisibleSuggestionId(res && res.length > 0 ? res[0].trip.id : null);
      setShowSheet(true);

      if (!res || res.length === 0) {
        Alert.alert("Avertissement", "Aucune suggestion trouvée à proximité.");
      } else if (res.length === 1) {
        focusTripPath(res[0].trip);
      }
    } catch {
      Alert.alert(
        "Avertissement",
        "Impossible d’obtenir des suggestions pour le moment."
      );
    } finally {
      setIsSearching(false);
    }
  };

  // on submit (entrée clavier)
  const onSubmitDestination = async () => {
    if (role !== "passenger") return;
    if ((query || "").trim().length < 3 && !end) {
      Alert.alert(
        "Info",
        "Tape au moins 3 lettres ou sélectionne une destination."
      );
      return;
    }
    const dest = await confirmDestinationFromQuery();
    if (dest) await findSuggestions();
  };

  // sélectionner un résultat géocodé
  const onPickGeo = async (g: any) => {
    setQuery(g.display_name);
    setGeoRes([]);
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
  const visibleMatches = visibleSuggestionId
    ? matches.filter((m) => m.trip.id === visibleSuggestionId)
    : matches;
  const visibleOwnTrips = visibleDriverTripId
    ? ownActiveTrips.filter((t) => t.id === visibleDriverTripId)
    : ownActiveTrips;

  return (
    <View style={styles.container}>
      <RoleModal
        role={role}
        visible={roleModal}
        setRole={setRole}
        setVisible={setRoleModal}
      />

      <PublishTripModal
        activeTrips={activeTrips}
        driverId={userId}
        end={end}
        myPath={myPath}
        publishModal={publishModal}
        start={start}
        setActiveTrips={setActiveTrips}
        setPublishModal={setPublishModal}
        willOverlap={willOverlap}
      />

      <CloseTripModal
        handleCloseTrip={doCloseTrip}
        focusTripPath={focusTripPath}
        closeModalTrip={closeModalTrip}
        setCloseModalTrip={setCloseModalTrip}
      />

      {/* ---- Barre de recherche (passager) */}
      <View style={styles.searchRow}>
        <TextInput
          placeholder={
            role === "passenger"
              ? "Rechercher une destination…"
              : "Destination (optionnel)"
          }
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
              <TouchableOpacity
                onPress={() => onPickGeo(item)}
                style={styles.row}
              >
                <Text numberOfLines={2} style={{ color: "#fff" }}>
                  {item.display_name}
                </Text>
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
        onRegionChangeComplete={(r: any) =>
          setMapCenter({ latitude: r.latitude, longitude: r.longitude })
        }
      >
        {role === "driver" &&
          visibleOwnTrips.map((t) => {
            const first = t.path[0];
            const last = t.path[t.path.length - 1];
            const isMine = true;
            return (
              <React.Fragment key={`active-${t.id}`}>
                <Polyline
                  coordinates={t.path.map((p) => ({
                    latitude: p.lat,
                    longitude: p.lng,
                  }))}
                  strokeWidth={isMine ? 4 : 3}
                  onPress={() => onOwnTripPress(t)}
                />
                {!!first && (
                  <Marker
                    coordinate={{ latitude: first.lat, longitude: first.lng }}
                    title="Départ"
                    pinColor="green"
                  />
                )}
                {!!last && (
                  <Marker
                    coordinate={{ latitude: last.lat, longitude: last.lng }}
                    title="Arrivée"
                    pinColor="red"
                  />
                )}
              </React.Fragment>
            );
          })}

        {/* Mon tracé local (driver only) */}
        {role === "driver" && myPath.length > 1 && (
          <Polyline coordinates={myPath} strokeWidth={4} />
        )}
        {role === "driver" && start && (
          <Marker coordinate={start} title="Départ" pinColor="green" />
        )}
        {role === "driver" && end && (
          <Marker coordinate={end} title="Destination" pinColor="red" />
        )}

        {/* Suggestions (surcouche) + points start/end */}
        {visibleMatches.map((m) => {
          const first = m.trip.path[0];
          const last = m.trip.path[m.trip.path.length - 1];
          return (
            <React.Fragment key={`sugg-${m.trip.id}`}>
              <Polyline
                coordinates={m.trip.path.map((p) => ({
                  latitude: p.lat,
                  longitude: p.lng,
                }))}
                strokeWidth={4}
              />
              {!!first && (
                <Marker
                  coordinate={{ latitude: first.lat, longitude: first.lng }}
                  title="Départ (sugg.)"
                  pinColor="green"
                />
              )}
              {!!last && (
                <Marker
                  coordinate={{ latitude: last.lat, longitude: last.lng }}
                  title="Arrivée (sugg.)"
                  pinColor="red"
                />
              )}
            </React.Fragment>
          );
        })}

        {role === "passenger" && currentPos && (
          <Marker
            coordinate={currentPos}
            title="Ma position"
            pinColor="#1E90FF"
          />
        )}
        {role === "passenger" && end && (
          <Marker coordinate={end} title="Ma destination" pinColor="#FFD700" />
        )}
      </MapView>

      {/* ---- Barre actions conducteurs */}
      {role === "driver" && (
        <DriverTrips
          ownActiveTrips={ownActiveTrips}
          focusTripPath={focusOwnTripPath}
          openPublish={openPublish}
          onOwnTripPress={onOwnTripPress}
        />
      )}

      {/* ---- Panneau Suggestions (fermable) */}
      {showSheet && matches.length > 0 && (
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>
              Suggestions ({matches.length}) — r ≤ {PROXIMITY_METERS} m
            </Text>
            <TouchableOpacity onPress={() => setShowSheet(false)}>
              <Text style={{ color: "#93c5fd", fontWeight: "700" }}>
                Fermer
              </Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={matches}
            keyExtractor={(m) => m.trip.id}
            renderItem={({ item }) => {
              const rStart = Math.round(
                (item as any).startDist ?? (item as any).startR ?? 0
              );
              const rEnd = Math.round(
                (item as any).endDist ?? (item as any).endR ?? 0
              );
              const driverName =
                item.trip.driver.firstName + " " + item.trip.driver.lastName ||
                shortId(item.trip.driver.uid);
              return (
                <View style={styles.card}>
                  {/* conducteur + avis bouton */}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text style={styles.sub}>Conducteur : {driverName}</Text>
                    <TouchableOpacity
                      style={styles.smallBtn}
                      onPress={() => {}}
                    >
                      <Text style={styles.smallBtnTxt}>Avis</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.sub}>
                    Départ : {fmtDate(item.trip.departureAt)} •{" "}
                    {fmtTime(item.trip.departureAt)}
                  </Text>
                  {(item.trip as any).arrivalAt && (
                    <Text style={styles.sub}>
                      Arrivée estimée : {fmtTime((item.trip as any).arrivalAt)}
                    </Text>
                  )}
                  <Text style={styles.sub}>
                    r(départ) = {rStart} m • r(arrivée) = {rEnd} m
                  </Text>
                  <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                    <TouchableOpacity
                      style={styles.viewBtn}
                      onPress={() => {
                        setVisibleSuggestionId(item.trip.id);
                        focusTripPath(item.trip);
                      }}
                    >
                      <Text style={{ color: "#000", fontWeight: "700" }}>
                        👁️
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.chatBtn} onPress={() => {}}>
                      <Text style={{ color: "#000", fontWeight: "700" }}>
                        ✉️
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.ask}
                      onPress={() => requestCarpool(item.trip.id)}
                    >
                      <Text style={{ color: "#000", fontWeight: "700" }}>
                        Demander
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
          />
        </View>
      )}

      {isSearching && <LoadingOverlay />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0b0b" },
  map: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  // barre recherche
  searchRow: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    zIndex: 5,
    flexDirection: "row",
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#1f2937",
    color: "#fff",
    padding: 12,
    borderRadius: 10,
  },
  searchBtn: {
    backgroundColor: "#22cc66",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  dropdown: {
    backgroundColor: "#111827",
    maxHeight: 200,
    borderRadius: 10,
    marginTop: 6,
    padding: 6,
    position: "absolute",
    top: 64,
    left: 16,
    right: 16,
    zIndex: 6,
  },
  row: { paddingVertical: 8 },

  viewBtn: { backgroundColor: "#93c5fd", padding: 10, borderRadius: 10 },
  ask: { backgroundColor: "#22cc66", padding: 10, borderRadius: 10 },
  chatBtn: { backgroundColor: "#fbbf24", padding: 10, borderRadius: 10 },

  smallBtn: {
    backgroundColor: "#1f2937",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  smallBtnTxt: { color: "#93c5fd", fontWeight: "700" },

  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#111827",
    padding: 12,
    maxHeight: 320,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  sheetTitle: { color: "#fff", fontWeight: "700" },
  card: {
    backgroundColor: "#0b1220",
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
  },
  sub: { color: "#cbd5e1", marginTop: 2 },
});
