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
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/")({ component: AdminOverview });

const COLORS = ["#06b6d4", "#f43f5e", "#f59e0b", "#a855f7", "#10b981"];

type SosRow = {
  id: string;
  user_id: string;
  lat: number;
  lng: number;
  status: string;
  vulnerability: Record<string, boolean> | null;
  note: string | null;
  created_at: string;
};

async function fetchAlerts(): Promise<SosRow[]> {
  console.log("[admin] fetching sos_alerts…");
  const { data, error } = await supabase
    .from("sos_alerts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) {
    console.error("[admin] sos_alerts fetch error:", error);
    throw error;
  }
  console.log(`[admin] fetched ${data?.length ?? 0} sos_alerts`);
  return (data ?? []) as SosRow[];
}

async function fetchRescues() {
  const { data, error } = await supabase.from("rescues").select("category, count, date");
  if (error) { console.error("[admin] rescues error", error); throw error; }
  return data ?? [];
}
async function fetchDistributions() {
  const sinceDate = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("resource_distributions")
    .select("type, quantity, date")
    .gte("date", sinceDate);
  if (error) { console.error("[admin] distributions error", error); throw error; }
  return data ?? [];
}
async function fetchNgos() {
  const { data, error } = await supabase.from("ngos").select("id").eq("active", true);
  if (error) { console.error("[admin] ngos error", error); throw error; }
  return data ?? [];
}

function AdminOverview() {
  const qc = useQueryClient();
  const [focused, setFocused] = useState<SosRow | null>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);

  const focusOnMap = (a: SosRow) => {
    if (a.lat == null) { toast.error("No location for this alert"); return; }
    setFocused(a);
    setTimeout(() => mapRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const { data: alerts = [] } = useQuery({
    queryKey: ["sos_alerts"],
    queryFn: fetchAlerts,
    refetchInterval: 5000, // polling fallback every 5s
  });
  const { data: rescues = [] } = useQuery({ queryKey: ["rescues"], queryFn: fetchRescues });
  const { data: distributions = [] } = useQuery({ queryKey: ["distributions"], queryFn: fetchDistributions });
  const { data: ngos = [] } = useQuery({ queryKey: ["ngos"], queryFn: fetchNgos });

  // Realtime subscription (in addition to polling)
  useEffect(() => {
    console.log("[admin] subscribing to sos_alerts realtime…");
    const ch = supabase
      .channel("sos_alerts_admin")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "sos_alerts" }, (payload) => {
        console.log("[admin] realtime INSERT", payload);
        const row = payload.new as SosRow;
        toast.error("🚨 New SOS alert received!", {
          description: `${row.lat?.toFixed(3)}, ${row.lng?.toFixed(3)}`,
        });
        qc.setQueryData<SosRow[]>(["sos_alerts"], (prev = []) =>
          prev.some((p) => p.id === row.id) ? prev : [row, ...prev],
        );
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "sos_alerts" }, (payload) => {
        console.log("[admin] realtime UPDATE", payload);
        const row = payload.new as SosRow;
        qc.setQueryData<SosRow[]>(["sos_alerts"], (prev = []) =>
          prev.map((a) => (a.id === row.id ? row : a)),
        );
      })
      .subscribe((status) => console.log("[admin] sos_alerts subscription:", status));
    return () => {
      console.log("[admin] unsubscribing sos_alerts");
      supabase.removeChannel(ch);
    };
  }, [qc]);

  const distByDate = Object.values(
    distributions.reduce((acc: Record<string, any>, d: any) => {
      const key = d.date;
      acc[key] = acc[key] || { date: String(key).slice(5) };
      acc[key][d.type] = (acc[key][d.type] || 0) + d.quantity;
      return acc;
    }, {}),
  );
  const distKeys = Array.from(new Set(distributions.map((d: any) => d.type)));

  const rescueAgg = rescues.reduce<Record<string, number>>((acc, r: any) => {
    acc[r.category] = (acc[r.category] || 0) + (r.count || 0);
    return acc;
  }, {});
  const rescueData = Object.entries(rescueAgg).map(([name, value]) => ({ name, value }));

  const pendingCount = alerts.filter((a) => a.status === "active" || a.status === "Pending").length;
  const totalRescued = rescues.reduce((s, r: any) => s + (r.count || 0), 0);
  const waterToday = distributions
    .filter((d: any) => /water/i.test(d.type))
    .reduce((s, d: any) => s + (d.quantity || 0), 0);

  const isVulnerable = (a: SosRow) => {
    const v = a.vulnerability || {};
    return !!(v.is_pregnant || v.is_child || v.is_minor || v.is_elderly || v.is_disabled);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat icon={AlertTriangle} label="Pending alerts" value={pendingCount} color="text-red-400" />
        <Stat icon={Users} label="People rescued" value={totalRescued} color="text-emerald-400" />
        <Stat icon={Droplets} label="Water units today" value={waterToday.toLocaleString()} color="text-cyan-400" />
        <Stat icon={Activity} label="Active NGOs" value={ngos.length} color="text-purple-400" />
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
                <Bar key={String(k)} dataKey={String(k)} fill={COLORS[i % COLORS.length]} radius={[6, 6, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 rounded-2xl bg-card">
          <h2 className="font-bold mb-4">Rescues by category</h2>
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
        <h2 className="font-bold mb-4">Live SOS feed ({alerts.length})</h2>
        <div className="space-y-2 max-h-96 overflow-auto">
          {alerts.length === 0 && <p className="text-muted-foreground text-sm">No alerts yet.</p>}
          {alerts.map((a) => {
            const vuln = isVulnerable(a);
            return (
              <div key={a.id} className={`p-3 rounded-xl border flex items-center justify-between ${vuln ? "border-red-500/40 bg-red-500/5" : "border-border"}`}>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold font-mono text-sm">{a.user_id.slice(0, 8)}</span>
                    {vuln && <Badge variant="destructive">PRIORITY</Badge>}
                    <Badge variant="outline">{a.status}</Badge>
                  </div>
                  {a.note && <p className="text-sm mt-1">{a.note}</p>}
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
              label: `SOS · ${a.status} · ${a.note ?? ""}`,
              color: a.id === focused?.id ? "#06b6d4" : isVulnerable(a) ? "#ef4444" : "#f59e0b",
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
