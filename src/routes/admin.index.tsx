import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { AlertTriangle, Activity, Droplets, Users, MapPin, ExternalLink } from "lucide-react";
import { ClientOnly } from "@/components/ClientOnly";
import MapView from "@/components/MapView";
import { toast } from "sonner";
import { api, openSosStream, type ApiSos } from "@/lib/api";

export const Route = createFileRoute("/admin/")({ component: AdminOverview });

const COLORS = ["#06b6d4", "#f43f5e", "#f59e0b", "#a855f7", "#10b981"];

function AdminOverview() {
  const qc = useQueryClient();
  const [focused, setFocused] = useState<ApiSos | null>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);

  const focusOnMap = (a: ApiSos) => {
    if (a.lat == null) { toast.error("No location for this alert"); return; }
    setFocused(a);
    setTimeout(() => mapRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const { data: alerts = [] } = useQuery({ queryKey: ["api", "sos"], queryFn: api.sosList });
  const { data: summary } = useQuery({ queryKey: ["api", "summary"], queryFn: api.analyticsSummary });
  const { data: rescues = [] } = useQuery({ queryKey: ["api", "rescues"], queryFn: api.analyticsRescues });
  const { data: distributions = [] } = useQuery({ queryKey: ["api", "dist"], queryFn: () => api.analyticsDistributions(7) });
  const { data: ngos = [] } = useQuery({ queryKey: ["api", "ngos"], queryFn: api.ngos });

  // Live SSE for SOS alerts
  useEffect(() => {
    const es = openSosStream((evt) => {
      if (evt.type === "new_sos") {
        toast.error("🚨 New SOS alert received!", {
          description: `Coords: ${evt.alert.lat?.toFixed(3)}, ${evt.alert.lng?.toFixed(3)}`,
        });
        qc.setQueryData<ApiSos[]>(["api", "sos"], (prev = []) => [evt.alert, ...prev]);
      } else if (evt.type === "status_update") {
        qc.setQueryData<ApiSos[]>(["api", "sos"], (prev = []) =>
          prev.map((a) => (a.id === evt.id ? { ...a, status: evt.status } : a)),
        );
      }
    });
    es.onerror = () => { /* let browser auto-retry; do not spam toasts */ };
    return () => es.close();
  }, [qc]);

  const distByDate = Object.values(
    distributions.reduce((acc: Record<string, any>, d) => {
      const key = d.date;
      acc[key] = acc[key] || { date: key.slice(5) };
      acc[key][d.item_type] = (acc[key][d.item_type] || 0) + d.quantity;
      return acc;
    }, {}),
  );
  const distKeys = Array.from(new Set(distributions.map((d) => d.item_type)));

  const rescueData = rescues.map((r) => ({ name: r.status, value: r.count }));
  const pendingCount = summary?.pending_alerts ?? alerts.filter((a) => a.status === "Pending").length;
  const totalRescued = rescues.reduce((s, r) => s + r.count, 0);
  const waterToday = distributions
    .filter((d) => /water/i.test(d.item_type))
    .reduce((s, d) => s + d.quantity, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat icon={AlertTriangle} label="Pending alerts" value={pendingCount} color="text-red-400" />
        <Stat icon={Users} label="People rescued" value={totalRescued} color="text-emerald-400" />
        <Stat icon={Droplets} label="Water units today" value={waterToday.toLocaleString()} color="text-cyan-400" />
        <Stat icon={Activity} label="NGOs registered" value={ngos.length} color="text-purple-400" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6 rounded-2xl bg-card">
          <h2 className="font-bold mb-4">Resource distribution (last 7 days)</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={distByDate as any[]}>
              <XAxis dataKey="date" stroke="#888" fontSize={11} />
              <YAxis stroke="#888" fontSize={11} />
              <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 8 }} />
              <Legend />
              {distKeys.map((k, i) => (
                <Bar key={k} dataKey={k} fill={COLORS[i % COLORS.length]} radius={[6, 6, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 rounded-2xl bg-card">
          <h2 className="font-bold mb-4">Rescues by status</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={rescueData} dataKey="value" nameKey="name" outerRadius={90} label>
                {rescueData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 8 }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-6 rounded-2xl bg-card">
        <h2 className="font-bold mb-4">Live SOS feed</h2>
        <div className="space-y-2 max-h-96 overflow-auto">
          {alerts.length === 0 && <p className="text-muted-foreground text-sm">No alerts yet.</p>}
          {alerts.map((a) => {
            const isVuln = !!(a.is_pregnant || a.is_child || a.is_disabled || a.is_minor || a.is_elderly);
            return (
              <div key={a.id} className={`p-3 rounded-xl border flex items-center justify-between ${isVuln ? "border-red-500/40 bg-red-500/5" : "border-border"}`}>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold font-mono text-sm">{a.user_id.slice(0, 8)}</span>
                    {isVuln && <Badge variant="destructive">PRIORITY</Badge>}
                    <Badge variant="outline">{a.status}</Badge>
                  </div>
                  {a.notes && <p className="text-sm mt-1">{a.notes}</p>}
                  <p className="text-xs text-muted-foreground">
                    {a.lat?.toFixed(4)}, {a.lng?.toFixed(4)} · {new Date(a.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-end">
                  <Button size="sm" variant="outline" onClick={() => focusOnMap(a)} disabled={a.lat == null}>
                    <MapPin className="w-3 h-3 mr-1" />View
                  </Button>
                  {a.lat != null && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={`https://www.google.com/maps?q=${a.lat},${a.lng}`} target="_blank" rel="noreferrer">
                        <ExternalLink className="w-3 h-3 mr-1" />Maps
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card ref={mapRef} className="p-6 rounded-2xl bg-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold">Alert map</h2>
          {focused && (
            <div className="text-xs text-muted-foreground">
              Focused on: <span className="font-semibold text-foreground">{focused.id.slice(0, 8)}</span> ({focused.lat?.toFixed(4)}, {focused.lng?.toFixed(4)})
              <button className="ml-2 underline" onClick={() => setFocused(null)}>clear</button>
            </div>
          )}
        </div>
        <ClientOnly fallback={<div className="h-[400px] rounded-2xl bg-muted animate-pulse" />}>
          <MapView
            key={focused?.id ?? "all"}
            center={[focused?.lat ?? alerts[0]?.lat ?? 28.6139, focused?.lng ?? alerts[0]?.lng ?? 77.209]}
            zoom={focused ? 16 : 11}
            height="400px"
            markers={alerts.filter((a) => a.lat != null).map((a) => ({
              id: a.id, lat: a.lat, lng: a.lng,
              label: `SOS · ${a.status} · ${a.notes ?? ""}`,
              color: a.id === focused?.id ? "#06b6d4"
                : (a.is_pregnant || a.is_child || a.is_disabled) ? "#ef4444"
                : "#f59e0b",
            }))}
          />
        </ClientOnly>
      </Card>
    </div>
  );
}

function Stat({ icon: Icon, label, value, color }: any) {
  return (
    <Card className="p-4 rounded-2xl bg-card">
      <Icon className={`w-5 h-5 ${color}`} />
      <p className="text-2xl font-bold mt-2 tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </Card>
  );
}
