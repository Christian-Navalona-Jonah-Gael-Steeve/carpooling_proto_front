import { R } from "@/constants/geolocation.constants";
import { Coord } from "../types/coord.types";

export const deg2rad = (d: number) => (d * Math.PI) / 180;

export function toXY(ref: Coord, p: Coord) {
  const latRef = deg2rad(ref.latitude);
  const x = deg2rad(p.longitude - ref.longitude) * Math.cos(latRef) * R;
  const y = deg2rad(p.latitude - ref.latitude) * R;
  return { x, y };
}

// Projection d’un point sur un segment (repère local en mètres)
export function projectPointOnSegmentMeters(p: Coord, a: Coord, b: Coord) {
  const P = toXY(a, p);
  const A = { x: 0, y: 0 };
  const B = toXY(a, b);

  const ABx = B.x - A.x,
    ABy = B.y - A.y;
  const APx = P.x - A.x,
    APy = P.y - A.y;

  const ab2 = ABx * ABx + ABy * ABy || 1e-9;
  let t = (APx * ABx + APy * ABy) / ab2;
  t = Math.max(0, Math.min(1, t));

  const Cx = A.x + t * ABx,
    Cy = A.y + t * ABy;
  const dx = P.x - Cx,
    dy = P.y - Cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const segLen = Math.sqrt(ab2);
  const alongOnSeg = t * segLen; // position projetée le long du segment (m)

  return { dist, alongOnSeg, segLen };
}

// Donne la distance au chemin + la position cumulée (m) le long du chemin
export function projectAlongMeters(p: Coord, path: Coord[]) {
  if (path.length < 2) return { dist: Infinity, along: 0 };
  let best = { dist: Infinity, along: 0 };
  let acc = 0; // cumul des longueurs précédentes
  for (let i = 0; i < path.length - 1; i++) {
    const proj = projectPointOnSegmentMeters(p, path[i], path[i + 1]);
    const alongHere = acc + proj.alongOnSeg;
    if (proj.dist < best.dist) best = { dist: proj.dist, along: alongHere };
    acc += proj.segLen;
  }
  return best; // { dist: distance minimale au chemin, along: position cumulée }
}
