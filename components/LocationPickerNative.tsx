import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { MapPressEvent, Marker, Region } from "react-native-maps";

export type LatLng = { lat: number; lng: number };
export type LocationValue = { text: string; coords?: LatLng };
export type LocationPickerValue = { from: LocationValue; to: LocationValue };

export function LocationPickerNative({
  value,
  onChange,
  initialRegion = DEFAULT_REGION,
  defaultClickTarget = "from",
}: {
  value?: LocationPickerValue;
  onChange?: (v: LocationPickerValue) => void;
  initialRegion?: Region;
  defaultClickTarget?: "from" | "to";
}) {
  const [from, setFrom] = useState<LocationValue>(value?.from ?? { text: "" });
  const [to, setTo] = useState<LocationValue>(value?.to ?? { text: "" });
  const [active, setActive] = useState<"from" | "to">(defaultClickTarget);

  const [fromQuery, setFromQuery] = useState(from.text);
  const [toQuery, setToQuery] = useState(to.text);
  const [fromOpts, setFromOpts] = useState<Place[]>([]);
  const [toOpts, setToOpts] = useState<Place[]>([]);
  const [loadingFrom, setLoadingFrom] = useState(false);
  const [loadingTo, setLoadingTo] = useState(false);

  useEffect(() => {
    onChange?.({ from, to });
  }, [from, to]);

  useEffect(() => {
    debounceSearch(fromQuery, setFromOpts, setLoadingFrom);
  }, [fromQuery]);
  useEffect(() => {
    debounceSearch(toQuery, setToOpts, setLoadingTo);
  }, [toQuery]);

  const canSearch = useMemo(() => !!(from.coords && to.coords), [from, to]);

  const onMapPress = async (e: MapPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    const label = await reverseGeocode(latitude, longitude);
    const next: LocationValue = {
      text: label,
      coords: { lat: latitude, lng: longitude },
    };
    if (active === "from") {
      setFrom(next);
      setFromQuery(label);
      setFromOpts([]);
    } else {
      setTo(next);
      setToQuery(label);
      setToOpts([]);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Départ</Text>
          <TextInput
            placeholder="Rechercher un lieu de départ"
            value={fromQuery}
            onChangeText={setFromQuery}
            onFocus={() => setActive("from")}
            style={[styles.input, active === "from" && styles.inputActive]}
          />
          {loadingFrom && <ActivityIndicator style={styles.spinner} />}
          <OptionList
            options={fromOpts}
            onPick={(p) => {
              const next = {
                text: p.label,
                coords: { lat: p.lat, lng: p.lon },
              };
              setFrom(next);
              setFromQuery(p.label);
              setFromOpts([]);
            }}
          />
        </View>
        <View style={{ width: 12 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Arrivée</Text>
          <TextInput
            placeholder="Rechercher un lieu d'arrivée"
            value={toQuery}
            onChangeText={setToQuery}
            onFocus={() => setActive("to")}
            style={[styles.input, active === "to" && styles.inputActive]}
          />
          {loadingTo && <ActivityIndicator style={styles.spinner} />}
          <OptionList
            options={toOpts}
            onPick={(p) => {
              const next = {
                text: p.label,
                coords: { lat: p.lat, lng: p.lon },
              };
              setTo(next);
              setToQuery(p.label);
              setToOpts([]);
            }}
          />
        </View>
      </View>

      <View style={styles.toggle}>
        <Text style={styles.toggleTitle}>Clic sur la carte →</Text>
        <ToggleOption
          title="Départ"
          selected={active === "from"}
          onPress={() => setActive("from")}
        />
        <ToggleOption
          title="Arrivée"
          selected={active === "to"}
          onPress={() => setActive("to")}
        />
        <TouchableOpacity
          onPress={() => {
            setFrom(to);
            setTo(from);
          }}
          style={styles.swapBtn}
        >
          <Text style={styles.swapText}>↕︎ Échanger</Text>
        </TouchableOpacity>
      </View>

      <MapView
        style={styles.map}
        initialRegion={initialRegion}
        onPress={onMapPress}
      >
        {from.coords && (
          <Marker
            coordinate={{
              latitude: from.coords.lat,
              longitude: from.coords.lng,
            }}
            title="Départ"
            description={from.text}
          />
        )}
        {to.coords && (
          <Marker
            coordinate={{ latitude: to.coords.lat, longitude: to.coords.lng }}
            title="Arrivée"
            description={to.text}
          />
        )}
      </MapView>

      <TouchableOpacity
        style={[styles.cta, !canSearch && { opacity: 0.6 }]}
        disabled={!canSearch}
        onPress={() => console.log("Recherche itinéraire", { from, to })}
      >
        <Text style={styles.ctaText}>Rechercher un trajet</Text>
      </TouchableOpacity>
    </View>
  );
}

function ToggleOption({
  title,
  selected,
  onPress,
}: {
  title: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.toggleBtn, selected && styles.toggleBtnActive]}
    >
      <Text style={[styles.toggleLabel, selected && styles.toggleLabelActive]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

function OptionList({
  options,
  onPick,
}: {
  options: Place[];
  onPick: (p: Place) => void;
}) {
  if (!options.length) return null;
  return (
    <FlatList
      keyboardShouldPersistTaps="handled"
      data={options}
      keyExtractor={(item, idx) => `${item.lat}-${item.lon}-${idx}`}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.option} onPress={() => onPick(item)}>
          <Text style={styles.optionText}>{item.label}</Text>
        </TouchableOpacity>
      )}
      style={styles.optionList}
    />
  );
}

// --- Geocoding helpers (Nominatim) ---
export type Place = { label: string; lat: number; lon: number };
let debounceTimer: any = null;
function debounceSearch(
  q: string,
  setOpts: (p: Place[]) => void,
  setLoading: (b: boolean) => void
) {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    if (!q || q.trim().length < 2) {
      setOpts([]);
      return;
    }
    setLoading(true);
    try {
      const url = new URL("https://nominatim.openstreetmap.org/search");
      url.searchParams.set("q", q);
      url.searchParams.set("format", "json");
      url.searchParams.set("addressdetails", "1");
      url.searchParams.set("limit", "8");
      const res = await fetch(url.toString(), {
        headers: { Accept: "application/json" },
      });
      const data = (await res.json()) as any[];
      const places: Place[] = data.map((d) => ({
        label: d.display_name,
        lat: parseFloat(d.lat),
        lon: parseFloat(d.lon),
      }));
      setOpts(places);
    } catch (e) {
      setOpts([]);
    } finally {
      setLoading(false);
    }
  }, 300);
}

async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lon));
    url.searchParams.set("format", "json");
    url.searchParams.set("zoom", "16");
    url.searchParams.set("addressdetails", "1");
    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
    });
    const data = await res.json();
    return data?.display_name || `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
  }
}

const DEFAULT_REGION: Region = {
  latitude: -18.8792,
  longitude: 47.5079,
  latitudeDelta: 0.2,
  longitudeDelta: 0.2,
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, gap: 12 },
  row: { flexDirection: "row" },
  label: { fontSize: 12, marginBottom: 4, color: "#4b5563" },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: "#fff",
  },
  inputActive: { borderColor: "#111827" },
  spinner: { position: "absolute", right: 10, top: 30 },
  optionList: {
    position: "absolute",
    top: 64,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    maxHeight: 220,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    zIndex: 20,
  },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  optionText: { fontSize: 14 },
  toggle: { flexDirection: "row", alignItems: "center", gap: 8 },
  toggleTitle: { color: "#4b5563", fontSize: 12, marginRight: 6 },
  toggleBtn: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  toggleBtnActive: { borderColor: "#111827", backgroundColor: "#11182710" },
  toggleLabel: { fontSize: 12, color: "#374151" },
  toggleLabelActive: { color: "#111827" },
  swapBtn: {
    marginLeft: "auto",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  swapText: { fontSize: 12, color: "#111827" },
  map: { flex: 1, borderRadius: 12, overflow: "hidden" },
  cta: {
    marginTop: 10,
    backgroundColor: "#111827",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  ctaText: { color: "#fff", fontWeight: "600" },
});

export default LocationPickerNative;
