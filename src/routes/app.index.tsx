import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { fetchNearby, type Place } from "@/lib/overpass";
import { haversineKm } from "@/lib/geo";
import { Card } from "@/components/ui/card";
import { Hospital, Shield, Flame, Tent, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/")({ component: SosHome });

function SosHome() {
  const { user, profile } = useAuth();
  const [sending, setSending] = useState(false);
  const [nearby, setNearby] = useState<{ hospitals: Place[]; shelters: Place[]; police: Place[]; fire: Place[] } | null>(null);
  const [loadingNearby, setLoadingNearby] = useState(true);

  useEffect(() => {
    if (!profile?.lat || !profile?.lng) return;
    fetchNearby(profile.lat, profile.lng).then((r) => { setNearby(r); setLoadingNearby(false); });
  }, [profile?.lat, profile?.lng]);

  const sendSos = async () => {
    if (!user || !profile?.lat || !profile?.lng) { toast.error("Missing location"); return; }
    setSending(true);
    const { error } = await supabase.from("sos_alerts").insert({
      user_id: user.id, lat: profile.lat, lng: profile.lng,
      vulnerability: {
        is_pregnant: profile.is_pregnant, is_child: profile.is_child, is_minor: profile.is_minor,
        is_elderly: profile.is_elderly, is_disabled: profile.is_disabled,
      },
    });
    setSending(false);
    if (error) toast.error(error.message);
    else toast.success("🚨 SOS sent! Help is being dispatched.");
  };

  const sortByDistance = (places: Place[]) =>
    profile?.lat && profile?.lng
      ? [...places].sort((a, b) => haversineKm({ lat: profile.lat!, lng: profile.lng! }, a) - haversineKm({ lat: profile.lat!, lng: profile.lng! }, b))
      : places;

  return (
    <div className="pt-4">
      <div className="text-center py-12">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200 }} className="inline-block relative">
          <button
            onClick={sendSos}
            disabled={sending}
            className="relative w-56 h-56 rounded-full bg-gradient-to-br from-red-500 to-pink-600 text-white text-4xl font-bold sos-glow active:scale-95 transition disabled:opacity-60"
          >
            <span className="water-ripple absolute inset-0 text-red-400/40" />
            {sending ? <Loader2 className="w-10 h-10 animate-spin mx-auto" /> : "SOS"}
          </button>
        </motion.div>
        <p className="mt-6 text-muted-foreground">Tap to alert nearest NGOs & government agencies</p>
      </div>

      <section className="mt-6">
        <h2 className="text-xl font-bold mb-4">Nearest help <span className="text-sm font-normal text-muted-foreground">(within 5 km)</span></h2>
        {loadingNearby ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1,2,3,4].map(i => <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <CategoryCard Icon={Hospital} color="from-rose-500 to-pink-500" label="Hospitals" places={sortByDistance(nearby?.hospitals ?? [])} userLoc={profile} />
            <CategoryCard Icon={Tent} color="from-amber-500 to-orange-500" label="Shelters" places={sortByDistance(nearby?.shelters ?? [])} userLoc={profile} />
            <CategoryCard Icon={Shield} color="from-blue-500 to-indigo-500" label="Police" places={sortByDistance(nearby?.police ?? [])} userLoc={profile} />
            <CategoryCard Icon={Flame} color="from-red-500 to-rose-500" label="Fire" places={sortByDistance(nearby?.fire ?? [])} userLoc={profile} />
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
      {places[0] && userLoc?.lat && (
        <p className="text-xs text-muted-foreground truncate mt-1">
          Nearest: {places[0].name} · {haversineKm({ lat: userLoc.lat, lng: userLoc.lng }, places[0]).toFixed(1)}km
        </p>
      )}
    </Card>
  );
}
