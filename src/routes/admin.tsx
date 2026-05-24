import { createFileRoute, Outlet, useNavigate, Link, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Shield, LayoutDashboard, Ambulance, UserSearch, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin")({ component: AdminShell });

function AdminShell() {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/" });
  }, [loading, user, navigate]);

  if (loading) return <div className="min-h-screen flex items-center justify-center admin-theme bg-background"><div className="text-muted-foreground">Loading...</div></div>;
  if (!user) return null;

  if (!isAdmin) {
    return (
      <div className="admin-theme min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="max-w-md text-center glass rounded-3xl p-8">
          <Shield className="w-12 h-12 mx-auto text-primary mb-4" />
          <h1 className="text-2xl font-bold">Admin access required</h1>
          <p className="text-muted-foreground mt-2 text-sm">Your account ({user.email}) doesn't have admin role. To grant access, an operator must add the <code className="bg-muted px-1 rounded">admin</code> role for your user_id in the user_roles table via Lovable Cloud → Database.</p>
          <Button onClick={() => navigate({ to: "/app" })} className="mt-6 rounded-full">Go to user app</Button>
        </div>
      </div>
    );
  }

  const tabs = [
    { to: "/admin", icon: LayoutDashboard, label: "Operations" },
    { to: "/admin/ambulances", icon: Ambulance, label: "Fleet" },
    { to: "/admin/missing", icon: UserSearch, label: "Missing" },
  ];

  return (
    <div className="admin-theme min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-40">
        <div className="container mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 font-bold">
              <Shield className="w-6 h-6 text-primary" />
              <span>ReliefNet <span className="text-primary">Ops</span></span>
            </div>
            <nav className="flex gap-1">
              {tabs.map((t) => {
                const active = loc.pathname === t.to;
                return (
                  <Link key={t.to} to={t.to} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                    <t.icon className="w-4 h-4" />{t.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <button onClick={() => { signOut(); navigate({ to: "/" }); }} className="text-muted-foreground hover:text-foreground"><LogOut className="w-5 h-5" /></button>
        </div>
      </header>
      <main className="container mx-auto px-6 py-6"><Outlet /></main>
    </div>
  );
}
