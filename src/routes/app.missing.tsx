import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/missing")({ component: Missing });

function Missing() {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", age: "", description: "", last_seen: "", contact: "" });
  const [file, setFile] = useState<File | null>(null);

  const { data: persons = [] } = useQuery({
    queryKey: ["missing"],
    queryFn: async () => (await supabase.from("missing_persons").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const submit = async () => {
    if (!user || !form.name) return;
    setSaving(true);
    let photo_url: string | null = null;
    if (file) {
      const path = `${user.id}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("missing-persons").upload(path, file);
      if (!upErr) photo_url = supabase.storage.from("missing-persons").getPublicUrl(path).data.publicUrl;
    }
    const { error } = await supabase.from("missing_persons").insert({
      reporter_id: user.id, name: form.name, age: form.age ? parseInt(form.age) : null,
      description: form.description, last_seen: form.last_seen, contact: form.contact, photo_url,
      last_seen_lat: profile?.lat ?? null, last_seen_lng: profile?.lng ?? null,
    });
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success("Report filed"); setOpen(false); setForm({ name: "", age: "", description: "", last_seen: "", contact: "" }); setFile(null); qc.invalidateQueries({ queryKey: ["missing"] }); }
  };

  return (
    <div className="pt-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-gradient-sunset">Missing Persons</h1><p className="text-muted-foreground mt-1">Report and search.</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="rounded-full gradient-sunset text-white border-0"><Plus className="w-4 h-4 mr-1" />Report</Button></DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Report a missing person</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Age</Label><Input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} /></div>
              <div><Label>Last seen (place)</Label><Input value={form.last_seen} onChange={(e) => setForm({ ...form, last_seen: e.target.value })} /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div><Label>Your contact</Label><Input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} /></div>
              <div><Label>Photo</Label>
                <label className="mt-1 flex items-center gap-2 border-2 border-dashed rounded-xl p-4 cursor-pointer hover:bg-accent/10">
                  <Upload className="w-5 h-5" /><span className="text-sm">{file?.name ?? "Choose file"}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                </label>
              </div>
              <Button onClick={submit} disabled={saving || !form.name} className="w-full">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "File report"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {persons.map((p: any) => (
          <Card key={p.id} className="glass rounded-2xl overflow-hidden">
            <div className="aspect-square bg-muted">{p.photo_url ? <img src={p.photo_url} alt={p.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground">No photo</div>}</div>
            <div className="p-3">
              <h3 className="font-bold">{p.name}{p.age ? `, ${p.age}` : ""}</h3>
              <p className="text-xs text-muted-foreground">{p.last_seen}</p>
            </div>
          </Card>
        ))}
        {persons.length === 0 && <p className="text-muted-foreground col-span-full">No reports yet.</p>}
      </div>
    </div>
  );
}
