import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/admin/missing")({ component: AdminMissing });

function AdminMissing() {
  const { data = [] } = useQuery({
    queryKey: ["admin-missing"],
    queryFn: async () => (await supabase.from("missing_persons").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Missing persons reports</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {data.map((p: any) => (
          <Card key={p.id} className="rounded-2xl bg-card overflow-hidden">
            <div className="aspect-square bg-muted">{p.photo_url ? <img src={p.photo_url} alt={p.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">No photo</div>}</div>
            <div className="p-3">
              <h3 className="font-bold text-sm">{p.name}{p.age ? `, ${p.age}` : ""}</h3>
              <p className="text-xs text-muted-foreground truncate">{p.last_seen}</p>
              <p className="text-xs text-muted-foreground mt-1">{p.contact}</p>
            </div>
          </Card>
        ))}
        {data.length === 0 && <p className="text-muted-foreground col-span-full text-sm">No reports yet.</p>}
      </div>
    </div>
  );
}
