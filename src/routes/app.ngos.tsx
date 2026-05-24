import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { haversineKm } from "@/lib/geo";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Phone, Globe } from "lucide-react";

export const Route = createFileRoute("/app/ngos")({ component: NgoExplore });

function NgoExplore() {
  const { profile } = useAuth();
  const { data: ngos = [] } = useQuery({
    queryKey: ["ngos"],
    queryFn: async () => {
      const { data } = await supabase.from("ngos").select("*").eq("active", true);
      return data ?? [];
    },
  });

  const sorted = profile?.lat && profile?.lng
    ? [...ngos].sort((a: any, b: any) => haversineKm({ lat: profile.lat!, lng: profile.lng! }, { lat: a.lat ?? 0, lng: a.lng ?? 0 }) - haversineKm({ lat: profile.lat!, lng: profile.lng! }, { lat: b.lat ?? 0, lng: b.lng ?? 0 }))
    : ngos;

  return (
    <div className="pt-4">
      <h1 className="text-3xl font-bold text-gradient-ocean">Nearby NGOs</h1>
      <p className="text-muted-foreground mt-1">Connect, volunteer, or donate.</p>
      <div className="mt-6 grid md:grid-cols-2 gap-4">
        {sorted.map((n: any) => (
          <Card key={n.id} className="glass p-5 rounded-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-lg">{n.name}</h3>
                <p className="text-xs text-muted-foreground">{n.city} · {n.category}</p>
              </div>
              {profile?.lat && n.lat && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                  {haversineKm({ lat: profile.lat, lng: profile.lng! }, { lat: n.lat, lng: n.lng }).toFixed(0)}km
                </span>
              )}
            </div>
            <p className="text-sm mt-2 text-muted-foreground">{n.description}</p>
            <div className="flex gap-2 mt-4">
              {n.phone && <a href={`tel:${n.phone}`} className="text-xs flex items-center gap-1 text-muted-foreground hover:text-primary"><Phone className="w-3 h-3" />{n.phone}</a>}
              {n.website && <a href={n.website} target="_blank" rel="noreferrer" className="text-xs flex items-center gap-1 text-muted-foreground hover:text-primary"><Globe className="w-3 h-3" />Website</a>}
            </div>
            {n.donation_url && (
              <Button asChild className="w-full mt-4 rounded-full gradient-sunset text-white border-0">
                <a href={n.donation_url} target="_blank" rel="noreferrer"><Heart className="w-4 h-4 mr-2" />Donate</a>
              </Button>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
