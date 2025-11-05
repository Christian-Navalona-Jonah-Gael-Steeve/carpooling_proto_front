import { Coord } from "../types/coord.types";

export function toLngLatPath(coords: Coord[]): [number, number][] {
  return coords.map((c) => [c.longitude, c.latitude]);
}
