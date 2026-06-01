import { createFileRoute, Outlet, useNavigate, Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Shield, LayoutDashboard, Ambulance, UserSearch, LogOut, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({ component: AdminShell });

const ADMIN_UID = "RAJ_07";
const ADMIN_PASSWORD = "RAJ@2007";
const STORAGE_KEY = "reliefnet_admin_auth";

function AdminShell() {
  const navigate = useNavigate();
  const loc = useLocation();
  const [opsAuthed, setOpsAuthed] = useState(false);
  const [checked, setChecked] = useState(false);
  const [uid, setUid] = useState("");
  const [pw, setPw] = useState("");

  useEffect(() => {
    setOpsAuthed(sessionStorage.getItem(STORAGE_KEY) === "1");
    setChecked(true);
  }, []);

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    if (uid.trim() === ADMIN_UID && pw === ADMIN_PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, "1");
      setOpsAuthed(true);
      toast.success("Welcome, operator");
    } else {
      toast.error("Invalid credentials");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setOpsAuthed(false);
    navigate({ to: "/" });
  };

  if (!checked) return <div className="admin-theme min-h-screen bg-background" />;

  if (!opsAuthed) {
    return (
      <div className="admin-theme min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 rounded-3xl bg-card">
          <div className="text-center mb-6">
            <Shield className="w-12 h-12 mx-auto text-primary mb-3" />
            <h1 className="text-2xl font-bold">ReliefNet <span className="text-primary">Ops</span></h1>
            <p className="text-sm text-muted-foreground mt-1">Authorized personnel only</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label>Operator UID</Label>
              <Input value={uid} onChange={(e) => setUid(e.target.value)} className="mt-1" autoComplete="username" placeholder="UID" />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} className="mt-1" autoComplete="current-password" placeholder="••••••••" />
            </div>
            <Button type="submit" className="w-full rounded-full h-11"><Lock className="w-4 h-4 mr-2" />Sign in to Ops</Button>
          </form>
        </Card>
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
          <button onClick={handleLogout} className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"><LogOut className="w-4 h-4" />Sign out</button>
        </div>
      </header>
      <main className="container mx-auto px-6 py-6"><Outlet /></main>
    </div>
  );
}
