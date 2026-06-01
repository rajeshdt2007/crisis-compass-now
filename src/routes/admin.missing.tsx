import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { api, apiImageUrl } from "@/lib/api";

export const Route = createFileRoute("/admin/missing")({ component: AdminMissing });

function AdminMissing() {
  const { data = [] } = useQuery({ queryKey: ["api", "missing"], queryFn: api.missing });
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Missing persons reports</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {data.map((p) => {
          const src = apiImageUrl("missing_persons", p.photo_path);
          return (
            <Card key={p.id} className="rounded-2xl bg-card overflow-hidden">
              <div className="aspect-square bg-muted">
                {src ? (
                  <img src={src} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
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
          );
        })}
        {data.length === 0 && <p className="text-muted-foreground col-span-full text-sm">No reports yet.</p>}
      </div>
    </div>
  );
}
