import { TripResponse } from "../api/trips.service";

export const willOverlap = (
  depISO: string,
  arrISO: string,
  trips: TripResponse[],
  userId: string
) => {
  const dep = new Date(depISO).getTime();
  const arr = new Date(arrISO).getTime();
  const mine = trips.filter((t) => t.driver.uid === userId);
  for (const t of mine) {
    const tDep = t.departureAt ? new Date(t.departureAt).getTime() : NaN;
    const tArr = (t as any).arrivalAt
      ? new Date((t as any).arrivalAt).getTime()
      : NaN;
    if (!isNaN(tDep) && !isNaN(tArr)) {
      const overlap = dep < tArr && arr > tDep;
      if (overlap) return true;
    }
  }
  return false;
};
