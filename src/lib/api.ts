// Read-only client for the external Python backend.
// All calls are GET. No mutations.
export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:5000";

const TOKEN_KEY = "reliefnet_session_token";

export function getSessionToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
}

export function setSessionToken(token: string) {
  if (typeof window !== "undefined") localStorage.setItem(TOKEN_KEY, token);
}

export function clearSessionToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  }
}

export async function apiGet<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getSessionToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("X-Session-Token", token);
  headers.set("Accept", "application/json");
  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, method: "GET", headers });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status} ${res.statusText}`);
  return (await res.json()) as T;
}

export function apiImageUrl(folder: string, filename: string | null | undefined): string | null {
  if (!filename) return null;
  return `${API_BASE_URL}/uploads/${folder}/${filename}`;
}

// ---- Types ----
export type ApiUser = {
  id: string; name: string; email: string; phone: string | null;
  lat: number | null; lng: number | null;
  is_pregnant: number; is_child: number; is_minor: number; is_elderly: number; is_disabled: number;
  is_admin: number;
};

export type ApiSos = {
  id: string; user_id: string; lat: number; lng: number; notes: string;
  status: "Pending" | "Dispatched" | "Resolved";
  is_pregnant: number; is_child: number; is_minor: number; is_elderly: number; is_disabled: number;
  created_at: string;
};

export type ApiNgo = {
  id: string; name: string; contact: string; service: string;
  lat: number; lng: number; distance_km?: number;
};

export type ApiMissing = {
  id: string; name: string; age: number | null; description: string;
  last_seen: string; photo_path: string | null;
};

export type ApiAmbulance = {
  id: string; name: string; status: "Available" | "Dispatched";
  lat: number; lng: number; assigned_sos_id: string | null;
};

export type ApiNotification = { id: string; message: string; created_at: string };

export type AnalyticsSummary = {
  total_users: number; total_alerts: number; pending_alerts: number; resolved_alerts: number;
};
export type AnalyticsRescue = { status: string; count: number };
export type AnalyticsDistribution = { id: string; item_type: string; quantity: number; date: string };

// ---- Endpoints ----
export const api = {
  me: () => apiGet<ApiUser>("/api/auth/me"),
  profile: (id: string) => apiGet<ApiUser>(`/api/profile/${id}`),
  sosList: () => apiGet<ApiSos[]>("/api/sos"),
  sos: (id: string) => apiGet<ApiSos>(`/api/sos/${id}`),
  nearby: (lat: number, lng: number, radius_km = 10) =>
    apiGet<ApiNgo[]>(`/api/nearby?lat=${lat}&lng=${lng}&radius_km=${radius_km}`),
  ngos: () => apiGet<ApiNgo[]>("/api/ngos"),
  missing: () => apiGet<ApiMissing[]>("/api/missing"),
  ambulances: () => apiGet<ApiAmbulance[]>("/api/ambulances"),
  notifications: () => apiGet<ApiNotification[]>("/api/notifications"),
  health: () => apiGet<{ status: string; database: string; timestamp: string }>("/api/health"),
  analyticsSummary: () => apiGet<AnalyticsSummary>("/api/analytics/summary"),
  analyticsRescues: () => apiGet<AnalyticsRescue[]>("/api/analytics/rescues"),
  analyticsDistributions: (days = 7) =>
    apiGet<AnalyticsDistribution[]>(`/api/analytics/distributions?days=${days}`),
};

// ---- SSE helpers ----
export type SosStreamEvent =
  | { type: "connected" }
  | { type: "new_sos"; alert: ApiSos }
  | { type: "status_update"; id: string; status: ApiSos["status"] };

export type AmbulanceStreamEvent = { type: "positions"; ambulances: ApiAmbulance[] };

export function openSosStream(onEvent: (e: SosStreamEvent) => void): EventSource {
  const es = new EventSource(`${API_BASE_URL}/api/sos/stream`);
  es.onmessage = (m) => {
    try { onEvent(JSON.parse(m.data)); } catch { /* ignore malformed */ }
  };
  return es;
}

export function openAmbulanceStream(onEvent: (e: AmbulanceStreamEvent) => void): EventSource {
  const es = new EventSource(`${API_BASE_URL}/api/ambulances/stream`);
  es.onmessage = (m) => {
    try { onEvent(JSON.parse(m.data)); } catch { /* ignore */ }
  };
  return es;
}
