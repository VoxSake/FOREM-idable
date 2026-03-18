"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CoachRecentActivityItem, formatCoachDate } from "@/features/coach/utils";

interface CoachRecentActivityProps {
  items: CoachRecentActivityItem[];
  onOpenItem: (userId: number, jobId: string | null) => void;
}

type CoachRecentActivityTab = "all" | "interviews";

export function CoachRecentActivity({ items, onOpenItem }: CoachRecentActivityProps) {
  const [activeTab, setActiveTab] = useState<CoachRecentActivityTab>("all");
  const filteredItems = useMemo(() => {
    const matchingItems = items.filter((item) => {
      if (activeTab === "interviews") {
        return item.detail.includes("entretien planifié");
      }

      return true;
    });

    return matchingItems.slice(0, 6);
  }, [activeTab, items]);

  const tabs: Array<{ id: CoachRecentActivityTab; label: string }> = [
    { id: "all", label: "Tout" },
    { id: "interviews", label: "Entretiens" },
  ];

  return (
    <section id="activite-recente" className="space-y-3 rounded-2xl border bg-card p-5 shadow-sm scroll-mt-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          <h2 className="text-xl font-bold">Activité récente</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Derniers mouvements utiles dans le suivi: candidatures mises à jour et entretiens planifiés.
        </p>
      </div>

      {items.length > 0 ? (
        <>
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={
                  activeTab === tab.id
                    ? "rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                    : "rounded-full border border-border/70 bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary/30 hover:text-foreground"
                }
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {filteredItems.length > 0 ? (
            <div className="grid gap-2 xl:grid-cols-2">
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="flex w-full items-start justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 p-3 text-left transition hover:border-primary/30 hover:bg-muted/40"
                  onClick={() => onOpenItem(item.userId, item.jobId)}
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-foreground">{item.userName}</p>
                      <Badge variant="outline">{item.groupLabel}</Badge>
                    </div>
                    <p className="text-sm text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.detail}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <p className="text-xs text-muted-foreground">{formatCoachDate(item.timestamp, true)}</p>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <button
              type="button"
              className="w-full rounded-xl border border-dashed border-border/70 bg-muted/10 px-4 py-6 text-left text-sm text-muted-foreground"
              onClick={() => setActiveTab("all")}
            >
              Aucune activité récente dans cet onglet. Revenir à `Tout`.
            </button>
          )}
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-border/70 bg-muted/10 px-4 py-6 text-sm text-muted-foreground">
          Aucune activité récente à afficher pour l&apos;instant.
        </div>
      )}
    </section>
  );
}
