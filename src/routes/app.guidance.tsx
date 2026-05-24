import { createFileRoute } from "@tanstack/react-router";
import { WHO_GUIDANCE } from "@/lib/who-guidance";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/app/guidance")({ component: Guidance });

function Guidance() {
  return (
    <div className="pt-4">
      <h1 className="text-3xl font-bold text-gradient-ocean">WHO Disaster Guidance</h1>
      <p className="text-muted-foreground mt-1">What to do before, during and after.</p>
      <div className="mt-6 grid md:grid-cols-2 gap-4">
        {WHO_GUIDANCE.map((g) => (
          <Card key={g.disaster} className="glass p-6 rounded-2xl">
            <div className={`inline-block px-4 py-2 rounded-full text-white bg-gradient-to-r ${g.color}`}>
              <span className="text-2xl mr-2">{g.emoji}</span><span className="font-bold">{g.disaster}</span>
            </div>
            <Accordion type="single" collapsible className="mt-4">
              {(["before", "during", "after"] as const).map((phase) => (
                <AccordionItem key={phase} value={phase}>
                  <AccordionTrigger className="capitalize">{phase}</AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-2 text-sm">
                      {g[phase].map((t, i) => <li key={i} className="flex gap-2"><span className="text-primary">•</span><span>{t}</span></li>)}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>
        ))}
      </div>
    </div>
  );
}
