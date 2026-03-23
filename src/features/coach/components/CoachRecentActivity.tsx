"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, CalendarClock, History, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { CoachFilterToggleGroup } from "@/features/coach/components/CoachFilterToggleGroup";
import {
  CoachRecentActivityFilter,
  coachRecentActivityFilterOptions,
} from "@/features/coach/filters";
import { CoachRecentActivityItem, formatCoachDate } from "@/features/coach/utils";

interface CoachRecentActivityProps {
  items: CoachRecentActivityItem[];
  onOpenItem: (userId: number, jobId: string | null) => void;
}

export function CoachRecentActivity({ items, onOpenItem }: CoachRecentActivityProps) {
  const [activeFilter, setActiveFilter] = useState<CoachRecentActivityFilter>("all");
  const filteredItems = useMemo(() => {
    const matchingItems = items.filter((item) => {
      if (activeFilter === "interviews") {
        return item.kind === "interview";
      }

      return true;
    });

    return matchingItems.slice(0, 6);
  }, [activeFilter, items]);

  return (
    <Card
      id="activite-recente"
      className="scroll-mt-6 gap-0 border-border/60 bg-card py-0"
    >
      <CardHeader className="border-b border-border/60 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              <CardTitle className="text-xl">Activité récente</CardTitle>
            </div>
            <CardDescription>
              Derniers mouvements utiles dans le suivi: candidatures mises à jour
              et entretiens planifiés.
            </CardDescription>
          </div>
          <Badge variant="outline">6 derniers événements</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 p-5">
        {items.length > 0 ? (
          <>
            <CoachFilterToggleGroup
              compact
              options={coachRecentActivityFilterOptions}
              value={activeFilter}
              onValueChange={setActiveFilter}
            />

            {filteredItems.length > 0 ? (
              <div className="grid gap-2 xl:grid-cols-2">
                {filteredItems.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    className="flex w-full animate-in items-start justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 p-3 text-left transition fade-in-0 slide-in-from-bottom-1 hover:border-primary/30 hover:bg-muted/30"
                    style={{ animationDelay: `${index * 35}ms` }}
                    onClick={() => onOpenItem(item.userId, item.jobId)}
                  >
                    <div className="flex min-w-0 flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-foreground">
                          {item.userName}
                        </p>
                        <Badge variant="outline">{item.groupLabel}</Badge>
                        <Badge variant={item.kind === "interview" ? "secondary" : "outline"}>
                          {item.kind === "interview" ? (
                            <CalendarClock data-icon="inline-start" />
                          ) : (
                            <RefreshCw data-icon="inline-start" />
                          )}
                          {item.kind === "interview" ? "Entretien" : "Mise à jour"}
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.detail}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <p className="text-xs text-muted-foreground">
                        {formatCoachDate(item.timestamp, true)}
                      </p>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <Empty className="min-h-40 bg-muted/10" onClick={() => setActiveFilter("all")}>
                <EmptyHeader>
                  <EmptyTitle>Aucune activité récente dans cet onglet</EmptyTitle>
                  <EmptyDescription>
                    Revenir à <span className="font-medium text-foreground">Tout</span> pour afficher l&apos;ensemble des événements.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </>
        ) : (
          <Empty className="min-h-40 bg-muted/10">
            <EmptyHeader>
              <EmptyTitle>Aucune activité récente</EmptyTitle>
              <EmptyDescription>
                Aucune activité récente à afficher pour l&apos;instant.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
    </Card>
  );
}
