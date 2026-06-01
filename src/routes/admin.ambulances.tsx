import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClientOnly } from "@/components/ClientOnly";
import MapView from "@/components/MapView";
import { Ambulance } from "lucide-react";
import { api, openAmbulanceStream, type ApiAmbulance } from "@/lib/api";

export const Route = createFileRoute("/admin/ambulances")({ component: Fleet });

const STATUS_COLOR: Record<string, string> = {
  Available: "#10b981",
  Dispatched: "#ef4444",
};

function Fleet() {
  const { data: initial = [] } = useQuery({ queryKey: ["api", "ambulances"], queryFn: api.ambulances });
  const [live, setLive] = useState<ApiAmbulance[] | null>(null);

  useEffect(() => {
    const es = openAmbulanceStream((evt) => {
      if (evt.type === "positions") setLive(evt.ambulances);
    });
    es.onerror = () => { /* silent retry */ };
    return () => es.close();
  }, []);

  const ambs = live ?? initial;
  const counts = ambs.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ambulance fleet</h1>
        <p className="text-muted-foreground text-sm">Real-time dispatch positions via live stream.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(STATUS_COLOR).map(([s, c]) => (
          <Card key={s} className="p-4 rounded-2xl bg-card">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ background: c }} />
              <span className="text-sm">{s}</span>
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
              label: `${a.name} · ${a.status}${a.assigned_sos_id ? ` · SOS ${a.assigned_sos_id.slice(0, 6)}` : ""}`,
              color: STATUS_COLOR[a.status] ?? "#888",
            }))}
          />
        </ClientOnly>
      </Card>
      <Card className="p-4 rounded-2xl bg-card">
        <h2 className="font-bold mb-3">Fleet roster</h2>
        <div className="grid md:grid-cols-3 gap-3">
          {ambs.map((a) => (
            <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <div className="flex items-center gap-2">
                <Ambulance className="w-4 h-4 text-primary" />
                <span className="font-mono text-sm">{a.name}</span>
              </div>
              <Badge variant="outline" style={{ borderColor: STATUS_COLOR[a.status], color: STATUS_COLOR[a.status] }}>
                {a.status}
              </Badge>
            </div>
          ))}
          {ambs.length === 0 && <p className="text-muted-foreground text-sm col-span-full">No ambulances reporting.</p>}
        </div>
      </Card>
    </div>
  );
}
