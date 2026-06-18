import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin/diagnostics")({ component: Diagnostics });

type Status = "ok" | "fail" | "pending";

function StatusPill({ s, label }: { s: Status; label: string }) {
  const icon = s === "ok" ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
    : s === "fail" ? <XCircle className="w-4 h-4 text-red-400" />
    : <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />;
  return <div className="flex items-center gap-2 text-sm">{icon}{label}</div>;
}

function Diagnostics() {
  const { user, isAdmin } = useAuth();
  const [dbStatus, setDbStatus] = useState<Status>("pending");
  const [dbError, setDbError] = useState<string | null>(null);
  const [rtStatus, setRtStatus] = useState<Status>("pending");
  const [rtMessage, setRtMessage] = useState<string>("connecting…");
  const [count, setCount] = useState<number | null>(null);
  const [last, setLast] = useState<any>(null);
  const [recent, setRecent] = useState<any[]>([]);

  const refresh = async () => {
    setDbStatus("pending"); setDbError(null);
    const { data, error, count: c } = await supabase
      .from("sos_alerts")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(5);
    if (error) {
      setDbStatus("fail"); setDbError(error.message);
      console.error("[diag] db error", error);
    } else {
      setDbStatus("ok");
      setCount(c ?? data?.length ?? 0);
      setRecent(data ?? []);
      setLast(data?.[0] ?? null);
    }
  };

  useEffect(() => { refresh(); }, []);

  useEffect(() => {
    const ch = supabase
      .channel("diag_sos")
      .on("postgres_changes", { event: "*", schema: "public", table: "sos_alerts" }, (p) => {
        console.log("[diag] realtime event", p);
        setLast(p.new ?? p.old);
        refresh();
      })
      .subscribe((status) => {
        console.log("[diag] subscription status:", status);
        setRtMessage(status);
        if (status === "SUBSCRIBED") setRtStatus("ok");
        else if (status === "CHANNEL_ERROR" || status === "CLOSED" || status === "TIMED_OUT") setRtStatus("fail");
      });
    return () => { supabase.removeChannel(ch); };
  }, []);

  const insertTestAlert = async () => {
    if (!user) { toast.error("Sign in first"); return; }
    const payload = {
      user_id: user.id,
      lat: 28.6139 + (Math.random() - 0.5) * 0.05,
      lng: 77.209 + (Math.random() - 0.5) * 0.05,
      note: "🧪 Diagnostics test alert",
      vulnerability: { is_pregnant: false },
    };
    console.log("[diag] inserting test alert", payload);
    const { data, error } = await supabase.from("sos_alerts").insert(payload).select().single();
    if (error) { console.error("[diag] insert error", error); toast.error(error.message); return; }
    console.log("[diag] insert ok", data);
    toast.success("Test alert created");
    refresh();
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <h1 className="text-2xl font-bold">Diagnostics</h1>

      <Card className="p-5 rounded-2xl bg-card space-y-3">
        <h2 className="font-semibold">Auth</h2>
        <div className="text-sm space-y-1">
          <div>Signed in: <Badge variant={user ? "default" : "destructive"}>{user ? user.email ?? user.id : "no"}</Badge></div>
          <div>Admin role: <Badge variant={isAdmin ? "default" : "destructive"}>{String(isAdmin)}</Badge></div>
        </div>
      </Card>

      <Card className="p-5 rounded-2xl bg-card space-y-3">
        <h2 className="font-semibold">Database (sos_alerts)</h2>
        <StatusPill s={dbStatus} label={dbStatus === "ok" ? "connected" : dbStatus === "fail" ? `failed: ${dbError}` : "checking…"} />
        <div className="text-sm">Records: <span className="font-mono">{count ?? "…"}</span></div>
        {last && (
          <div className="text-xs text-muted-foreground">
            Last: {last.id?.slice(0, 8)} · {last.lat?.toFixed(3)}, {last.lng?.toFixed(3)} · {new Date(last.created_at).toLocaleString()}
          </div>
        )}
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={refresh}>Refresh</Button>
          <Button size="sm" onClick={insertTestAlert}>Insert test SOS</Button>
        </div>
      </Card>

      <Card className="p-5 rounded-2xl bg-card space-y-3">
        <h2 className="font-semibold">Realtime channel</h2>
        <StatusPill s={rtStatus} label={rtMessage} />
        <p className="text-xs text-muted-foreground">If realtime is failing, the dashboard still polls every 5s.</p>
      </Card>

      <Card className="p-5 rounded-2xl bg-card">
        <h2 className="font-semibold mb-2">Recent alerts</h2>
        <div className="space-y-1 text-xs font-mono">
          {recent.map((r) => (
            <div key={r.id}>{r.id.slice(0, 8)} · {r.status} · {new Date(r.created_at).toLocaleTimeString()}</div>
          ))}
          {recent.length === 0 && <p className="text-muted-foreground">none</p>}
        </div>
      </Card>
    </div>
  );
}
