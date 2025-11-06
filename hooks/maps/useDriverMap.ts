import { fetchRoute, TripMatchResponse } from "@/lib/api/trips.service";
import { Coord } from "@/lib/types/coord.types";
import { useState } from "react";
import { Alert } from "react-native";

export const useDriverMap = ({
  role,
  setMatches,
  setPublishModal,
}: {
  role: string;
  setMatches: React.Dispatch<React.SetStateAction<TripMatchResponse[]>>;
  setPublishModal: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [start, setStart] = useState<Coord | null>(null);
  const [end, setEnd] = useState<Coord | null>(null);
  const [myPath, setMyPath] = useState<Coord[]>([]);

  const onLongPress = async (e: any) => {
    if (role === "passenger") return;
    const c = e.nativeEvent.coordinate as Coord;
    if (!start) {
      setStart(c);
      setEnd(null);
      setMyPath([]);
      setMatches([]);
    } else if (!end) {
      setEnd(c);
      const p = await fetchRoute(start, c);
      setMyPath(p);
      setMatches([]);
    } else {
      setStart(c);
      setEnd(null);
      setMyPath([]);
      setMatches([]);
    }
  };

  const openPublish = () => {
    if (role !== "driver") return;
    if (!start || !end || myPath.length < 2) {
      Alert.alert(
        "Info",
        "Trace d’abord le départ et l’arrivée (appuis longs)."
      );
      return;
    }
    setPublishModal(true);
  };

  return {
    end,
    myPath,
    start,
    onLongPress,
    openPublish,
    setEnd,
    setMyPath,
  };
};
