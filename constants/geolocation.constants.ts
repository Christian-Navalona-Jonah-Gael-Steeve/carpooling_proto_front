import { Region } from "react-native-maps";

export const INITIAL_REGION: Region = {
  latitude: -18.8792, // Antananarivo
  longitude: 47.5079,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

export const PROXIMITY_METERS = 1500; // rayon de coïncidence (change 20/30m)
export const COVERAGE_THRESHOLD = 0.1; // % de points "proches" requis (simple)

/** ─────────────────────────────
 *  Outil géo (meters ~ petites distances)
 *  ────────────────────────────*/
export const R = 6371000; // rayon Terre en m
