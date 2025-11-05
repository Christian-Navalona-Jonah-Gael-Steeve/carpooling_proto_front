import { api } from "./base/api";

export type LatLngDto = { lat: number; lng: number };

export type CreateTripInput = {
  driverId: string;
  title?: string;
  start: LatLngDto;
  end: LatLngDto;
  path: [number, number][];
  seats?: number;
  priceMga?: number;
  departureAt?: string;
  arrivalAt?: string;
};

export type TripResponse = {
  id: string;
  title: string | null;
  seats: number | null;
  priceMga: number | null;
  departureAt: string | null;
  arrivalAt: string | null;
  start: LatLngDto;
  end: LatLngDto;
  path: LatLngDto[];
  driver: { uid: string; firstName: string | null; lastName: string | null };
};

export type TripMatchResponse = {
  trip: TripResponse;
  startDist: number; // mètres
  endDist: number; // mètres
};

export async function createTrip(input: CreateTripInput) {
  const { data } = await api.post<TripResponse>("/trips", input);
  return data;
}

export async function searchTrips(input: {
  start: LatLngDto;
  end: LatLngDto;
  radiusMeters?: number;
  minCoverage?: number;
  limit?: number;
}) {
  const { data } = await api.post<TripMatchResponse[]>("/trips/search", {
    ...input,
    radiusMeters: input.radiusMeters ?? 30,
    minCoverage: input.minCoverage ?? 0.1,
    limit: input.limit ?? 20,
  });
  return data;
}

export async function listTrips() {
  const { data } = await api.get<TripResponse[]>("/trips");
  return data;
}

export async function closeTrip(id: string) {
  const { data } = await api.patch<TripResponse>(`/trips/${id}/close`, {});
  return data;
}
