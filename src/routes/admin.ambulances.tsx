import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClientOnly } from "@/components/ClientOnly";
import MapView from "@/components/MapView";
import { Ambulance } from "lucide-react";

export const Route = createFileRoute("/admin/ambulances")({ component: Fleet });

const STATUS_COLOR: Record<string, string> = {
  available: "#10b981", "en-route": "#f59e0b", "on-scene": "#ef4444", returning: "#6366f1",
};

function Fleet() {
  const { data: ambs = [], refetch } = useQuery({
    queryKey: ["ambs"],
    queryFn: async () => (await supabase.from("ambulances").select("*")).data ?? [],
  });
  const [tick, setTick] = useState(0);

  // Simulate movement client-side every 3s
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 3000);
    return () => clearInterval(i);
  }, []);

  const moving = ambs.map((a: any) => ({
    ...a,
    lat: a.lat + Math.sin((tick + a.code.length) * 0.3) * 0.005,
    lng: a.lng + Math.cos((tick + a.code.length) * 0.3) * 0.005,
  }));

  const counts = moving.reduce((acc: any, a: any) => { acc[a.status] = (acc[a.status] || 0) + 1; return acc; }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ambulance fleet</h1>
        <p className="text-muted-foreground text-sm">Real-time Uber-style dispatch prototype.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(STATUS_COLOR).map(([s, c]) => (
          <Card key={s} className="p-4 rounded-2xl bg-card">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ background: c }} />
              <span className="text-sm capitalize">{s}</span>
            </div>
            <p className="text-2xl font-bold mt-2 tabular-nums">{counts[s] ?? 0}</p>
          </Card>
        ))}
      </div>
      <Card className="p-4 rounded-2xl bg-card">
        <ClientOnly fallback={<div className="h-[500px] rounded-2xl bg-muted animate-pulse" />}>
          <MapView
            center={[28.6139, 77.2090]}
            zoom={12}
            height="500px"
            markers={moving.map((a: any) => ({ id: a.id, lat: a.lat, lng: a.lng, label: `${a.code} · ${a.status}`, color: STATUS_COLOR[a.status] ?? "#888" }))}
          />
        </ClientOnly>
      </Card>
      <Card className="p-4 rounded-2xl bg-card">
        <h2 className="font-bold mb-3">Fleet roster</h2>
        <div className="grid md:grid-cols-3 gap-3">
          {moving.map((a: any) => (
            <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <div className="flex items-center gap-2"><Ambulance className="w-4 h-4 text-primary" /><span className="font-mono text-sm">{a.code}</span></div>
              <Badge variant="outline" style={{ borderColor: STATUS_COLOR[a.status], color: STATUS_COLOR[a.status] }}>{a.status}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
