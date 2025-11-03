import { api } from "./base/api";
import { LatLngDto } from "./trips.service";



export type RideRequestResponse = { id: string; tripId: string; requesterId: string; status: "PENDING" | "ACCEPTED" | "REJECTED" };

export type CreateRideRequest = {
  tripId: string;
  start: LatLngDto;
  end: LatLngDto;
  driverId?: string;
  userId?: string;
};

export async function createRideRequest(input: CreateRideRequest) {
  const { data } = await api.post<RideRequestResponse>("/requests", input);
  return data;
}

export async function acceptRideRequest(id: string) {
  const { data } = await api.post<RideRequestResponse>(`/requests/${id}/accept`, {});
  return data;
}

export async function rejectRideRequest(id: string) {
  const { data } = await api.post<RideRequestResponse>(`/requests/${id}/reject`, {});
  return data;
}
