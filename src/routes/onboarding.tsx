import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { WaterBackground } from "@/components/WaterBackground";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/onboarding")({ component: Onboarding });

function Onboarding() {
  const { user, profile, loading, refresh } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<"location" | "form">("location");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [flags, setFlags] = useState({ is_pregnant: false, is_child: false, is_minor: false, is_elderly: false, is_disabled: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!loading && !user) navigate({ to: "/" }); }, [loading, user, navigate]);
  useEffect(() => { if (profile?.name) setName(profile.name); }, [profile]);

  const requestLocation = () => {
    if (!navigator.geolocation) { toast.error("Geolocation not supported"); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => { setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }); setStep("form"); toast.success("Location captured"); },
      () => toast.error("Location permission required to continue"),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const save = async () => {
    if (!user || !coords || !name.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      name: name.trim(), phone: phone.trim() || null, lat: coords.lat, lng: coords.lng,
      ...flags, onboarded: true,
    }).eq("id", user.id);
    if (error) { toast.error(error.message); setSaving(false); return; }
    await refresh();
    navigate({ to: "/app" });
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6">
      <WaterBackground />
      <Card className="glass max-w-lg w-full p-8 rounded-3xl">
        {step === "location" ? (
          <div className="text-center">
            <MapPin className="w-16 h-16 text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold">Enable location</h1>
            <p className="mt-2 text-muted-foreground">Required so we can dispatch help to your exact position during an emergency.</p>
            <Button onClick={requestLocation} size="lg" className="mt-6 rounded-full px-8">Share my location</Button>
          </div>
        ) : (
          <div>
            <h1 className="text-2xl font-bold mb-1">A few quick details</h1>
            <p className="text-sm text-muted-foreground mb-6">Helps responders prioritise.</p>
            <div className="space-y-4">
              <div><Label>Your name</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" /></div>
              <div><Label>Phone (optional)</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1" /></div>
              <div>
                <Label>Anyone with you that needs priority care?</Label>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  {([
                    ["is_pregnant", "Pregnant woman"],
                    ["is_child", "Child"],
                    ["is_minor", "Minor"],
                    ["is_elderly", "Elderly"],
                    ["is_disabled", "Physically disabled"],
                  ] as const).map(([k, label]) => (
                    <label key={k} className="flex items-center gap-2 rounded-xl border p-3 cursor-pointer hover:bg-accent/10">
                      <Checkbox checked={flags[k]} onCheckedChange={(v) => setFlags((f) => ({ ...f, [k]: !!v }))} />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <Button onClick={save} disabled={saving || !name.trim()} className="w-full rounded-full h-12">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Continue"}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
