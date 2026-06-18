import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClientOnly } from "@/components/ClientOnly";
import MapView from "@/components/MapView";
import { Ambulance } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/ambulances")({ component: Fleet });

type Amb = {
  id: string; code: string; lat: number; lng: number;
  status: string; assigned_alert_id: string | null; updated_at: string;
};

const STATUS_COLOR: Record<string, string> = {
  available: "#10b981",
  dispatched: "#ef4444",
  busy: "#f59e0b",
};

async function fetchAmbulances(): Promise<Amb[]> {
  const { data, error } = await supabase.from("ambulances").select("*").order("code");
  if (error) { console.error("[admin] ambulances error", error); throw error; }
  return (data ?? []) as Amb[];
}

function Fleet() {
  const qc = useQueryClient();
  const { data: ambs = [] } = useQuery({
    queryKey: ["ambulances"],
    queryFn: fetchAmbulances,
    refetchInterval: 5000,
  });

  useEffect(() => {
    const ch = supabase
      .channel("ambulances_admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "ambulances" }, () => {
        qc.invalidateQueries({ queryKey: ["ambulances"] });
      })
      .subscribe((s) => console.log("[admin] ambulances subscription:", s));
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  const counts = ambs.reduce<Record<string, number>>((acc, a) => {
    const key = a.status.toLowerCase();
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ambulance fleet</h1>
        <p className="text-muted-foreground text-sm">Live positions and dispatch status.</p>
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
            center={[ambs[0]?.lat ?? 28.6139, ambs[0]?.lng ?? 77.209]}
            zoom={12}
            height="500px"
            markers={ambs.map((a) => ({
              id: a.id, lat: a.lat, lng: a.lng,
              label: `${a.code} · ${a.status}${a.assigned_alert_id ? ` · SOS ${a.assigned_alert_id.slice(0, 6)}` : ""}`,
              color: STATUS_COLOR[a.status.toLowerCase()] ?? "#888",
            }))}
          />
        </ClientOnly>
      </Card>
      <Card className="p-4 rounded-2xl bg-card">
        <h2 className="font-bold mb-3">Fleet roster</h2>
        <div className="grid md:grid-cols-3 gap-3">
          {ambs.map((a) => {
            const color = STATUS_COLOR[a.status.toLowerCase()] ?? "#888";
            return (
              <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                <div className="flex items-center gap-2">
                  <Ambulance className="w-4 h-4 text-primary" />
                  <span className="font-mono text-sm">{a.code}</span>
                </div>
                <Badge variant="outline" style={{ borderColor: color, color }}>{a.status}</Badge>
              </div>
            );
          })}
          {ambs.length === 0 && <p className="text-muted-foreground text-sm col-span-full">No ambulances reporting.</p>}
        </div>
      </Card>
    </div>
  );
}
