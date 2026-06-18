import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/missing")({ component: AdminMissing });

type Missing = {
  id: string; name: string; age: number | null; description: string | null;
  last_seen: string | null; photo_url: string | null; status: string | null; created_at: string;
};

async function fetchMissing(): Promise<Missing[]> {
  const { data, error } = await supabase
    .from("missing_persons")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) { console.error("[admin] missing_persons error", error); throw error; }
  return (data ?? []) as Missing[];
}

function AdminMissing() {
  const { data = [] } = useQuery({ queryKey: ["missing_persons"], queryFn: fetchMissing, refetchInterval: 10000 });
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Missing persons reports ({data.length})</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {data.map((p) => (
          <Card key={p.id} className="rounded-2xl bg-card overflow-hidden">
            <div className="aspect-square bg-muted">
              {p.photo_url ? (
                <img src={p.photo_url} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">No photo</div>
              )}
            </div>
            <div className="p-3">
              <h3 className="font-bold text-sm">{p.name}{p.age ? `, ${p.age}` : ""}</h3>
              <p className="text-xs text-muted-foreground truncate">{p.last_seen}</p>
              {p.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description}</p>}
            </div>
          </Card>
        ))}
        {data.length === 0 && <p className="text-muted-foreground text-sm col-span-full">No reports yet.</p>}
      </div>
    </div>
  );
}
