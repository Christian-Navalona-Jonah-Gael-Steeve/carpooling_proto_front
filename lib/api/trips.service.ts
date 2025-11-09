import { Coord } from "../types/coord.types";
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

export type TripStatus = 'ACTIVE' | 'CLOSED' | 'COMPLETED';

export interface ITrip {
  id: string;
  driverId: string;
  status: TripStatus;
  start: LatLngDto;
  end: LatLngDto;
  departureAt?: string;
  arrivalAt?: string;
  createdAt: string;
}

export interface IRideRequest {
  id: string;
  tripId: string;
  requesterId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
}

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

export async function completeTrip(id: string) {
    const { data } = await api.patch<TripResponse>(`/trips/${id}/complete`, {});
    return data;
}

export async function hasCompletedTripWithDriver(passengerId: string, driverId: string): Promise<boolean> {
  try {
    const { data: requests } = await api.get<IRideRequest[]>("/requests");

    const acceptedRequests = requests.filter(request => 
      request.requesterId === passengerId && 
      request.status === 'ACCEPTED'
    );
    
    if (acceptedRequests.length === 0) {
      return false;
    }
    
    for (const request of acceptedRequests) {
      try {
        const { data: trip } = await api.get<TripResponse>(`/trips/${request.tripId}`);

        if (trip.driver.uid === driverId) {
          const { data: tripStatus } = await api.get<{ status: TripStatus }>(`/trips/${request.tripId}/status`);
          if (tripStatus.status === 'COMPLETED') {
            return true;
          }
        }
      } catch (error) {
        console.warn(`Error checking trip ${request.tripId}:`, error);
        continue;
      }
    }
    
    return false;
    
  } catch (error) {
    console.error('Error checking completed trips:', error);

    try {
      return await checkUserTripRelationship(passengerId, driverId);
    } catch (fallbackError) {
      return false;
    }
  }
}

export async function getCompletedTrips(userId: string): Promise<TripResponse[]> {
  try {
    const { data: trips } = await api.get<TripResponse[]>("/trips?status=COMPLETED");

    const driverTrips = trips.filter(trip => trip.driver.uid === userId);
    
    const { data: requests } = await api.get<IRideRequest[]>("/requests");
    const passengerRequestIds = requests
      .filter(request => request.requesterId === userId && request.status === 'ACCEPTED')
      .map(request => request.tripId);
    
    const passengerTrips = trips.filter(trip => 
      passengerRequestIds.includes(trip.id)
    );
    
    return [...driverTrips, ...passengerTrips];
    
  } catch (error) {
    console.error('Error getting completed trips:', error);
    return [];
  }
}

export async function checkUserTripRelationship(passengerId: string, driverId: string): Promise<boolean> {
  try {
    const { data: requests } = await api.get<IRideRequest[]>("/requests");
    
    const hasAcceptedRequest = requests.some(request => 
      request.requesterId === passengerId && 
      request.status === 'ACCEPTED'
    );
    
    if (!hasAcceptedRequest) {
      return false;
    }
    
    for (const request of requests) {
      if (request.requesterId === passengerId && request.status === 'ACCEPTED') {
        try {
          const { data: trip } = await api.get<TripResponse>(`/trips/${request.tripId}`);
          if (trip.driver.uid === driverId) {
            return true;
          }
        } catch (error) {
          continue;
        }
      }
    }
    
    return false;
    
  } catch (error) {
    console.error('Error checking trip relationship:', error);
    return false;
  }
}


export async function hasCompletedTripWithDriverOptimized(passengerId: string, driverId: string): Promise<boolean> {
  try {
    const { data } = await api.get<{ hasCompletedTrip: boolean }>(
      `/trips/check-completed?passengerId=${passengerId}&driverId=${driverId}`
    );
    return data.hasCompletedTrip;
  } catch (error) {
    return await hasCompletedTripWithDriver(passengerId, driverId);
  }
}

export async function fetchRoute(o: Coord, d: Coord): Promise<Coord[]> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${o.longitude},${o.latitude};${d.longitude},${d.latitude}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const json = await res.json();
    if (json?.routes?.[0]?.geometry?.coordinates) {
      return json.routes[0].geometry.coordinates.map(
        ([lng, lat]: [number, number]) => ({ latitude: lat, longitude: lng })
      );
    }
  } catch {}
  return [o, d];
}
