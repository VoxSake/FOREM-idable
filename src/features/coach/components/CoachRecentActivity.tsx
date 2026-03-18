"use client";

import { ArrowUpRight, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CoachRecentActivityItem, formatCoachDate } from "@/features/coach/utils";

interface CoachRecentActivityProps {
  items: CoachRecentActivityItem[];
  onOpenUser: (userId: number) => void;
}

export function CoachRecentActivity({ items, onOpenUser }: CoachRecentActivityProps) {
  return (
    <section className="space-y-3 rounded-2xl border bg-card p-5 shadow-sm">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          <h2 className="text-xl font-bold">Activité récente</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Derniers mouvements utiles dans le suivi: notes coach, candidatures mises à jour et entretiens planifiés.
        </p>
      </div>

      {items.length > 0 ? (
        <div className="space-y-2">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className="flex w-full items-start justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 p-3 text-left transition hover:border-primary/30 hover:bg-muted/40"
              onClick={() => onOpenUser(item.userId)}
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
        <div className="rounded-xl border border-dashed border-border/70 bg-muted/10 px-4 py-6 text-sm text-muted-foreground">
          Aucune activité récente à afficher pour l&apos;instant.
        </div>
      )}
    </section>
  );
}
