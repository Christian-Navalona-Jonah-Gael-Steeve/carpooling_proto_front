import { geocode } from "@/lib/api/geocode.service";
import {
  closeTrip,
  fetchRoute,
  TripMatchResponse,
  TripResponse,
} from "@/lib/api/trips.service";
import { Coord } from "@/lib/types/coord.types";
import { Role } from "@/lib/types/user.types";
import { useState } from "react";
import { Alert } from "react-native";

interface IUseTripHandlers {
  end: Coord | null;
  start: Coord | null;
  setMatches: React.Dispatch<React.SetStateAction<TripMatchResponse[]>>;
  setEnd: React.Dispatch<React.SetStateAction<Coord | null>>;
  setMyPath: React.Dispatch<React.SetStateAction<Coord[]>>;
  setActiveTrips: React.Dispatch<React.SetStateAction<TripResponse[]>>;
}

export const useTripHandlers = ({
  end,
  start,
  setMatches,
  setActiveTrips,
  setEnd,
  setMyPath,
}: IUseTripHandlers) => {
  const [closeModalTrip, setCloseModalTrip] = useState<TripResponse | null>(
    null
  );

  /**
   * Given a query string, try to find the destination coordinates
   * using geocoding. If the query is empty or too short, return null.
   * If geocoding is successful, set the end coordinates and if the start
   * coordinates are already set and the user is a driver, fetch the route
   * between the start and end coordinates and set it as the myPath.
   * @returns {Promise<Coord | null>} The destination coordinates or null if
   * the query is empty or too short, or if geocoding fails.
   */
  const confirmDestinationFromQuery = async (
    query: string,
    role: Role
  ): Promise<Coord | null> => {
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

  return {
    closeModalTrip,
    setCloseModalTrip,
    confirmDestinationFromQuery,
    doCloseTrip,
  };
};
