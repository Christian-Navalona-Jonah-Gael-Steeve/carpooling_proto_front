import { listTrips, TripResponse } from "@/lib/api/trips.service";
import { useEffect, useState } from "react";

export const useActiveTrips = () => {
  const [activeTrips, setActiveTrips] = useState<TripResponse[]>([]);
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
  return { activeTrips, setActiveTrips };
};
