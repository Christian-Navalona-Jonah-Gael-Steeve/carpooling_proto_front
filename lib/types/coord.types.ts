export type Coord = { latitude: number; longitude: number; title?: string };

export type Trip = { id: string; path: Coord[] };
