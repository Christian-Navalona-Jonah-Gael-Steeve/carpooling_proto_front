import { Coord } from "@/lib/types/coord.types";
import { Role } from "@/lib/types/user.types";
import * as Location from "expo-location";
import { useEffect, useState } from "react";

export const usePassengerLocation = (role: Role) => {
  const [currentPos, setCurrentPos] = useState<Coord | null>(null);
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
  return { currentPos, setCurrentPos };
};
