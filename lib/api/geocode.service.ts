export type GeoPlace = { display_name: string; lat: string; lon: string };

async function fetchJsonResilient(url: string, init?: RequestInit): Promise<any> {
    const res = await fetch(url, init);
    const ct = res.headers.get("content-type") || "";
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}: ${text.slice(0, 200)}`);
    try {
        if (ct.includes("application/json")) return JSON.parse(text);
        return JSON.parse(text);
    } catch {
        throw new Error(`Réponse non JSON (content-type=${ct}): ${text.slice(0, 200)}`);
    }
}

function mapNominatim(x: any): GeoPlace {
    return { display_name: x.display_name, lat: String(x.lat), lon: String(x.lon) };
}

function mapPhoton(x: any): GeoPlace {
    const [lon, lat] = x.geometry?.coordinates ?? [x.lon, x.lat];
    const label = x.properties?.name || x.properties?.city || x.properties?.country || "Lieu";
    return { display_name: label, lat: String(lat), lon: String(lon) };
}

export async function geocode(query: string): Promise<GeoPlace[]> {
    const q = (query || "").trim();
    if (!q) return [];

    try {
        const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&q=${encodeURIComponent(q)}`;
        const data = await fetchJsonResilient(url, {
            headers: {
                "User-Agent": "CarpoolingApp/1.0 (contact@example.com)",
                "Accept-Language": "fr",
            },
        });
        if (Array.isArray(data)) return data.map(mapNominatim);
    } catch (e) {
        console.log("Nominatim KO:", (e as Error).message);
    }

    try {
        const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=5&lang=fr`;
        const data = await fetchJsonResilient(url);
        if (Array.isArray(data?.features)) return data.features.map(mapPhoton);
    } catch (e) {
        console.log("Photon KO:", (e as Error).message);
    }

    return [];
}
