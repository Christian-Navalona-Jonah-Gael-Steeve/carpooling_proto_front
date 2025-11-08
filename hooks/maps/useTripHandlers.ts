import { geocode } from "@/lib/api/geocode.service";
import { fetchRoute } from "@/lib/api/trips.service";
import { Coord } from "@/lib/types/coord.types";
import { Role } from "@/lib/types/user.types";

interface IUseTripHandlers {
  end: Coord | null;
  start: Coord | null;
  setEnd: React.Dispatch<React.SetStateAction<Coord | null>>;
  setMyPath: React.Dispatch<React.SetStateAction<Coord[]>>;
}

export const useTripHandlers = ({
  end,
  start,
  setEnd,
  setMyPath,
}: IUseTripHandlers) => {
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

  return { confirmDestinationFromQuery };
};
