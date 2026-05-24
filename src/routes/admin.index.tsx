import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { AlertTriangle, Activity, Droplets, Users, Bell, MapPin, ExternalLink } from "lucide-react";
import { ClientOnly } from "@/components/ClientOnly";
import MapView from "@/components/MapView";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/")({ component: AdminOverview });

const COLORS = ["#06b6d4", "#f43f5e", "#f59e0b", "#a855f7", "#10b981"];

function AdminOverview() {
  const qc = useQueryClient();
  const [focused, setFocused] = useState<any>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);

  const focusOnMap = (a: any) => {
    if (!a?.lat) { toast.error("No location for this alert"); return; }
    setFocused(a);
    setTimeout(() => mapRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const { data: alerts = [] } = useQuery({
    queryKey: ["alerts"],
    queryFn: async () => (await supabase.from("sos_alerts").select("*, profiles(name, phone)").order("created_at", { ascending: false }).limit(50)).data ?? [],
  });
  const { data: distributions = [] } = useQuery({
    queryKey: ["dist"],
    queryFn: async () => (await supabase.from("resource_distributions").select("*").order("date")).data ?? [],
  });
  const { data: rescues = [] } = useQuery({
    queryKey: ["rescues"],
    queryFn: async () => (await supabase.from("rescues").select("*")).data ?? [],
  });
  const { data: ngos = [] } = useQuery({
    queryKey: ["ngos"],
    queryFn: async () => (await supabase.from("ngos").select("*").eq("active", true)).data ?? [],
  });

  useEffect(() => {
    const ch = supabase.channel("ops-alerts")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "sos_alerts" }, (payload) => {
        toast.error("🚨 New SOS alert received!", { description: `Coords: ${(payload.new as any).lat?.toFixed(3)}, ${(payload.new as any).lng?.toFixed(3)}` });
        qc.invalidateQueries({ queryKey: ["alerts"] });
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  // Distribution chart: group by date
  const distByDate = Object.values(
    distributions.reduce((acc: any, d: any) => {
      acc[d.date] = acc[d.date] || { date: d.date.slice(5), health_kit: 0, food_kit: 0, water_litres: 0 };
      acc[d.date][d.type] = (acc[d.date][d.type] || 0) + d.quantity;
      return acc;
    }, {})
  );

  const rescueData = rescues.map((r: any) => ({ name: r.category, value: r.count }));
  const totalRescued = rescues.reduce((s: number, r: any) => s + r.count, 0);
  const todayWater = distributions.filter((d: any) => d.type === "water_litres").reduce((s: number, d: any) => s + d.quantity, 0);

  const notify = async (alert: any) => {
    const { error } = await supabase.from("notifications").insert({ alert_id: alert.id, message: "Dispatched to nearest NGO", channel: "dashboard" });
    if (!error) toast.success("Notification logged");
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat icon={AlertTriangle} label="Active alerts" value={alerts.filter((a: any) => a.status === "active").length} color="text-red-400" />
        <Stat icon={Users} label="People rescued" value={totalRescued} color="text-emerald-400" />
        <Stat icon={Droplets} label="Water (L) today" value={todayWater.toLocaleString()} color="text-cyan-400" />
        <Stat icon={Activity} label="Active NGOs" value={ngos.length} color="text-purple-400" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6 rounded-2xl bg-card">
          <h2 className="font-bold mb-4">Resource distribution (last 7 days)</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={distByDate}>
              <XAxis dataKey="date" stroke="#888" fontSize={11} />
              <YAxis stroke="#888" fontSize={11} />
              <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 8 }} />
              <Legend />
              <Bar dataKey="health_kit" fill="#06b6d4" radius={[6,6,0,0]} />
              <Bar dataKey="food_kit" fill="#f59e0b" radius={[6,6,0,0]} />
              <Bar dataKey="water_litres" fill="#a855f7" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 rounded-2xl bg-card">
          <h2 className="font-bold mb-4">People rescued by category</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={rescueData} dataKey="value" nameKey="name" outerRadius={90} label>
                {rescueData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
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
          {alerts.map((a: any) => {
            const v = a.vulnerability ?? {};
            const isVuln = v.is_pregnant || v.is_child || v.is_disabled;
            return (
              <div key={a.id} className={`p-3 rounded-xl border flex items-center justify-between ${isVuln ? "border-red-500/40 bg-red-500/5" : "border-border"}`}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{a.profiles?.name ?? "Unknown"}</span>
                    {isVuln && <Badge variant="destructive">PRIORITY</Badge>}
                    <Badge variant="outline">{a.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{a.lat?.toFixed(4)}, {a.lng?.toFixed(4)} · {new Date(a.created_at).toLocaleString()}</p>
                </div>
                <Button size="sm" onClick={() => notify(a)}><Bell className="w-3 h-3 mr-1" />Notify NGO</Button>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-6 rounded-2xl bg-card">
        <h2 className="font-bold mb-4">Alert map</h2>
        <ClientOnly fallback={<div className="h-[400px] rounded-2xl bg-muted animate-pulse" />}>
          <MapView
            center={[alerts[0]?.lat ?? 28.6139, alerts[0]?.lng ?? 77.2090]}
            zoom={11}
            height="400px"
            markers={alerts.filter((a: any) => a.lat).map((a: any) => ({
              id: a.id, lat: a.lat, lng: a.lng,
              label: `SOS · ${a.profiles?.name ?? "user"}`,
              color: (a.vulnerability?.is_pregnant || a.vulnerability?.is_child || a.vulnerability?.is_disabled) ? "#ef4444" : "#f59e0b",
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
