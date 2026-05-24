export type Place = {
  id: number;
  name: string;
  lat: number;
  lng: number;
  type: string;
  tags: Record<string, string>;
};

const ENDPOINT = "https://overpass-api.de/api/interpreter";

export async function fetchNearby(
  lat: number,
  lng: number,
  radiusM = 5000,
): Promise<{ hospitals: Place[]; shelters: Place[]; police: Place[]; fire: Place[] }> {
  const q = `
    [out:json][timeout:15];
    (
      node["amenity"="hospital"](around:${radiusM},${lat},${lng});
      node["amenity"="clinic"](around:${radiusM},${lat},${lng});
      node["amenity"="shelter"](around:${radiusM},${lat},${lng});
      node["emergency"="assembly_point"](around:${radiusM},${lat},${lng});
      node["amenity"="police"](around:${radiusM},${lat},${lng});
      node["amenity"="fire_station"](around:${radiusM},${lat},${lng});
    );
    out body 60;
  `;
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "data=" + encodeURIComponent(q),
    });
    if (!res.ok) throw new Error("overpass failed");
    const data = await res.json();
    const places: Place[] = (data.elements ?? []).map((e: any) => ({
      id: e.id,
      name: e.tags?.name ?? "Unnamed",
      lat: e.lat,
      lng: e.lon,
      type: e.tags?.amenity ?? e.tags?.emergency ?? "place",
      tags: e.tags ?? {},
    }));
    return {
      hospitals: places.filter((p) => p.type === "hospital" || p.type === "clinic"),
      shelters: places.filter((p) => p.type === "shelter" || p.type === "assembly_point"),
      police: places.filter((p) => p.type === "police"),
      fire: places.filter((p) => p.type === "fire_station"),
    };
  } catch {
    return { hospitals: [], shelters: [], police: [], fire: [] };
  }
}
