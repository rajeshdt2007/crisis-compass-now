import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/use-auth";
import { WaterBackground } from "@/components/WaterBackground";
import { Button } from "@/components/ui/button";
import { Shield, Waves, Heart, MapPin } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/")({ component: Landing });

function Landing() {
  const { session, profile, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!session) return;
    if (isAdmin) { navigate({ to: "/admin" }); return; }
    if (profile && !profile.onboarded) { navigate({ to: "/onboarding" }); return; }
    if (profile?.onboarded) navigate({ to: "/app" });
  }, [loading, session, profile, isAdmin, navigate]);

  const signIn = async () => {
    setSigning(true);
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (res.error) { toast.error("Sign-in failed"); setSigning(false); }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <WaterBackground />
      <header className="container mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-xl">
          <Waves className="w-7 h-7 text-primary" />
          <span className="text-gradient-ocean">ReliefNet</span>
        </div>
        <a href="/admin" className="text-sm text-muted-foreground hover:text-primary">Server portal →</a>
      </header>
      <main className="container mx-auto px-6 pt-12 pb-24">
        <div className="max-w-3xl mx-auto text-center">
          <motion.h1 initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.7 }} className="text-5xl md:text-7xl font-bold tracking-tight">
            When seconds matter, <span className="text-gradient-ocean">we connect</span> you to help.
          </motion.h1>
          <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="mt-6 text-lg text-muted-foreground">
            One-tap SOS, nearest NGOs, hospitals & rescue centers — coordinated in real time during floods, earthquakes, cyclones and landslides.
          </motion.p>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.4 }} className="mt-10">
            <Button onClick={signIn} disabled={signing} size="lg" className="rounded-full px-8 h-14 text-base shadow-[var(--shadow-glow)]">
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24"><path fill="currentColor" d="M21.35 11.1H12v3.2h5.35c-.5 2.5-2.6 3.85-5.35 3.85-3.25 0-5.9-2.65-5.9-5.9s2.65-5.9 5.9-5.9c1.5 0 2.85.55 3.9 1.45l2.4-2.4C16.6 3.6 14.45 2.7 12 2.7 6.85 2.7 2.7 6.85 2.7 12s4.15 9.3 9.3 9.3c5.4 0 8.95-3.8 8.95-9.15 0-.55-.05-1.05-.15-1.55z"/></svg>
              {signing ? "Connecting..." : "Continue with Google"}
            </Button>
            <p className="mt-4 text-xs text-muted-foreground">We'll ask for your location to find the nearest help.</p>
          </motion.div>
        </div>
        <div className="mt-24 grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            { Icon: Shield, t: "One-tap SOS", d: "Alerts NGOs and government orgs nearest to you, instantly." },
            { Icon: MapPin, t: "Find help nearby", d: "Hospitals, shelters, police & rescue centers in your radius." },
            { Icon: Heart, t: "Vulnerability-aware", d: "Pregnant women, children, elderly & disabled get priority response." },
          ].map(({ Icon, t, d }, i) => (
            <motion.div key={t} initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 + i * 0.1 }} className="glass rounded-3xl p-6">
              <Icon className="w-10 h-10 text-primary mb-3" />
              <h3 className="font-semibold text-lg">{t}</h3>
              <p className="text-sm text-muted-foreground mt-1">{d}</p>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
