import { createFileRoute, Outlet, useNavigate, Link, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { WaterBackground } from "@/components/WaterBackground";
import { Waves, Home, Building2, BookOpen, UserSearch, LogOut } from "lucide-react";

export const Route = createFileRoute("/app")({ component: AppShell });

function AppShell() {
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/" });
    else if (profile && !profile.onboarded) navigate({ to: "/onboarding" });
  }, [loading, user, profile, navigate]);

  const tabs = [
    { to: "/app", icon: Home, label: "SOS" },
    { to: "/app/ngos", icon: Building2, label: "NGOs" },
    { to: "/app/guidance", icon: BookOpen, label: "Guidance" },
    { to: "/app/missing", icon: UserSearch, label: "Missing" },
  ];

  return (
    <div className="relative min-h-screen pb-24">
      <WaterBackground />
      <header className="container mx-auto px-6 py-5 flex items-center justify-between">
        <Link to="/app" className="flex items-center gap-2 font-bold">
          <Waves className="w-6 h-6 text-primary" />
          <span className="text-gradient-ocean">ReliefNet</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground hidden sm:inline">Hi, {profile?.name?.split(" ")[0] ?? "there"}</span>
          <button onClick={() => { signOut(); navigate({ to: "/" }); }} className="text-muted-foreground hover:text-foreground">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>
      <main className="container mx-auto px-4 pb-32"><Outlet /></main>
      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 glass rounded-full px-2 py-2 flex gap-1 shadow-[var(--shadow-glow)] z-50">
        {tabs.map((t) => {
          const active = loc.pathname === t.to;
          return (
            <Link key={t.to} to={t.to} className={`flex flex-col items-center px-4 py-2 rounded-full transition ${active ? "bg-primary text-primary-foreground" : "hover:bg-accent/10"}`}>
              <t.icon className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">{t.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
