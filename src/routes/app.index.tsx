import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { fetchNearby, type Place } from "@/lib/overpass";
import { haversineKm } from "@/lib/geo";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Hospital, Shield, Flame, Tent, Loader2, MapPin, Crosshair } from "lucide-react";
import { toast } from "sonner";
import { ClientOnly } from "@/components/ClientOnly";
import MapView from "@/components/MapView";

export const Route = createFileRoute("/app/")({ component: SosHome });

function SosHome() {
  const { user, profile, refresh } = useAuth();
  const [sending, setSending] = useState(false);
  const [nearby, setNearby] = useState<{ hospitals: Place[]; shelters: Place[]; police: Place[]; fire: Place[] } | null>(null);
  const [loadingNearby, setLoadingNearby] = useState(true);
  const [liveCoords, setLiveCoords] = useState<{ lat: number; lng: number } | null>(
    profile?.lat && profile?.lng ? { lat: profile.lat, lng: profile.lng } : null,
  );
  const [tracking, setTracking] = useState(false);
  const watchId = useRef<number | null>(null);

  // Auto-prompt for location on mount if missing
  useEffect(() => {
    if (!liveCoords && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => setLiveCoords({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => {},
        { enableHighAccuracy: true, timeout: 8000 },
      );
    }
  }, []);

  useEffect(() => {
    if (!liveCoords) return;
    setLoadingNearby(true);
    fetchNearby(liveCoords.lat, liveCoords.lng).then((r) => { setNearby(r); setLoadingNearby(false); });
  }, [liveCoords?.lat, liveCoords?.lng]);

  const startLiveTracking = () => {
    if (!navigator.geolocation) { toast.error("Geolocation not supported on this device"); return; }
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    setTracking(true);
    toast.info("Requesting location permission…");
    watchId.current = navigator.geolocation.watchPosition(
      async (p) => {
        const coords = { lat: p.coords.latitude, lng: p.coords.longitude };
        setLiveCoords(coords);
        // Persist to profile so admin can see the latest pin
        if (user) {
          await supabase.from("profiles").update({ lat: coords.lat, lng: coords.lng }).eq("id", user.id);
        }
      },
      (err) => {
        setTracking(false);
        const msg =
          err.code === err.PERMISSION_DENIED ? "Location permission denied. Enable it in your browser settings."
          : err.code === err.POSITION_UNAVAILABLE ? "Location unavailable."
          : err.code === err.TIMEOUT ? "Location request timed out."
          : "Could not get location.";
        toast.error(msg);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );
  };

  useEffect(() => () => {
    if (watchId.current !== null) navigator.geolocation?.clearWatch(watchId.current);
  }, []);

  const sendSos = async () => {
    console.log("[sos] button pressed", { user: user?.id, liveCoords });
    if (!user) { toast.error("Not signed in"); return; }
    if (!liveCoords) { toast.error("Tap 'Share live location' first"); return; }
    setSending(true);
    const payload = {
      user_id: user.id, lat: liveCoords.lat, lng: liveCoords.lng,
      vulnerability: {
        is_pregnant: profile?.is_pregnant, is_child: profile?.is_child, is_minor: profile?.is_minor,
        is_elderly: profile?.is_elderly, is_disabled: profile?.is_disabled,
      },
    };
    console.log("[sos] inserting", payload);
    const { data, error } = await supabase.from("sos_alerts").insert(payload).select().single();
    setSending(false);
    if (error) {
      console.error("[sos] insert failed", error);
      toast.error(error.message);
    } else {
      console.log("[sos] insert ok", data);
      toast.success("🚨 SOS sent! Help is being dispatched.");
      refresh();
    }
  };

  const sortByDistance = (places: Place[]) =>
    liveCoords
      ? [...places].sort((a, b) => haversineKm(liveCoords, a) - haversineKm(liveCoords, b))
      : places;

  const mapMarkers = [
    ...(liveCoords ? [{ id: "me", lat: liveCoords.lat, lng: liveCoords.lng, label: "You are here", color: "#06b6d4" }] : []),
    ...sortByDistance(nearby?.hospitals ?? []).slice(0, 8).map((p) => ({ id: `h-${p.id}`, lat: p.lat, lng: p.lng, label: `🏥 ${p.name}`, color: "#ef4444" })),
    ...sortByDistance(nearby?.shelters ?? []).slice(0, 5).map((p) => ({ id: `s-${p.id}`, lat: p.lat, lng: p.lng, label: `⛺ ${p.name}`, color: "#f59e0b" })),
    ...sortByDistance(nearby?.police ?? []).slice(0, 5).map((p) => ({ id: `p-${p.id}`, lat: p.lat, lng: p.lng, label: `🛡️ ${p.name}`, color: "#3b82f6" })),
  ];

  return (
    <div className="pt-4 space-y-8">
      {/* Live location bar */}
      <Card className="glass p-4 rounded-2xl flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <MapPin className={`w-5 h-5 ${liveCoords ? "text-emerald-500" : "text-amber-500"}`} />
          <div>
            <p className="text-sm font-semibold">
              {liveCoords ? "Live location active" : "Location not shared yet"}
            </p>
            <p className="text-xs text-muted-foreground tabular-nums">
              {liveCoords ? `${liveCoords.lat.toFixed(5)}, ${liveCoords.lng.toFixed(5)}` : "Rescue teams can't reach you without it"}
            </p>
          </div>
        </div>
        <Button onClick={startLiveTracking} variant={liveCoords ? "outline" : "default"} className="rounded-full">
          <Crosshair className="w-4 h-4 mr-2" />
          {tracking ? "Tracking…" : liveCoords ? "Refresh live location" : "Share live location"}
        </Button>
      </Card>

      {/* SOS button */}
      <div className="text-center py-6">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200 }} className="inline-block relative">
          <button
            onClick={sendSos}
            disabled={sending || !liveCoords}
            className="relative w-56 h-56 rounded-full bg-gradient-to-br from-red-500 to-pink-600 text-white text-4xl font-bold sos-glow active:scale-95 transition disabled:opacity-60"
          >
            <span className="water-ripple absolute inset-0 text-red-400/40" />
            {sending ? <Loader2 className="w-10 h-10 animate-spin mx-auto" /> : "SOS"}
          </button>
        </motion.div>
        <p className="mt-6 text-muted-foreground">Tap to alert nearest NGOs & government agencies</p>
      </div>

      {/* Live map */}
      <section>
        <h2 className="text-xl font-bold mb-3">Live map</h2>
        <Card className="p-2 rounded-2xl overflow-hidden">
          <ClientOnly fallback={<div className="h-[360px] rounded-2xl bg-muted animate-pulse" />}>
            <MapView
              center={liveCoords ? [liveCoords.lat, liveCoords.lng] : [28.6139, 77.2090]}
              zoom={liveCoords ? 14 : 5}
              height="360px"
              markers={mapMarkers}
            />
          </ClientOnly>
          <p className="text-xs text-muted-foreground p-2">Map tiles are cached by your browser — once loaded, they remain available offline for the same area.</p>
        </Card>
      </section>

      {/* Nearest help */}
      <section>
        <h2 className="text-xl font-bold mb-4">Nearest help <span className="text-sm font-normal text-muted-foreground">(within 5 km)</span></h2>
        {!liveCoords ? (
          <p className="text-muted-foreground text-sm">Share your live location to see nearby help.</p>
        ) : loadingNearby ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1,2,3,4].map(i => <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <CategoryCard Icon={Hospital} color="from-rose-500 to-pink-500" label="Hospitals" places={sortByDistance(nearby?.hospitals ?? [])} userLoc={liveCoords} />
            <CategoryCard Icon={Tent} color="from-amber-500 to-orange-500" label="Shelters" places={sortByDistance(nearby?.shelters ?? [])} userLoc={liveCoords} />
            <CategoryCard Icon={Shield} color="from-blue-500 to-indigo-500" label="Police" places={sortByDistance(nearby?.police ?? [])} userLoc={liveCoords} />
            <CategoryCard Icon={Flame} color="from-red-500 to-rose-500" label="Fire" places={sortByDistance(nearby?.fire ?? [])} userLoc={liveCoords} />
          </div>
        )}
      </section>
    </div>
  );
}

function CategoryCard({ Icon, color, label, places, userLoc }: any) {
  return (
    <Card className="glass p-4 rounded-2xl">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-2`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <h3 className="font-semibold">{label}</h3>
      <p className="text-2xl font-bold">{places.length}</p>
      {places[0] && userLoc && (
        <p className="text-xs text-muted-foreground truncate mt-1">
          Nearest: {places[0].name} · {haversineKm(userLoc, places[0]).toFixed(1)}km
        </p>
      )}
    </Card>
  );
}
