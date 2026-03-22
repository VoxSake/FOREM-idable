"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
    <Card
      id="activite-recente"
      className="scroll-mt-6 gap-0 border-border/60 bg-gradient-to-br from-background to-muted/20 py-0"
    >
      <CardHeader className="border-b border-border/60 py-5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            <CardTitle className="text-xl">Activité récente</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Derniers mouvements utiles dans le suivi: candidatures mises à jour
            et entretiens planifiés.
          </p>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 p-5">
        {items.length > 0 ? (
          <>
            <ToggleGroup
              type="single"
              value={activeTab}
              onValueChange={(value) => {
                if (value) {
                  setActiveTab(value as CoachRecentActivityTab);
                }
              }}
              variant="outline"
              className="flex flex-wrap gap-2"
              spacing={1}
            >
              {tabs.map((tab) => (
                <ToggleGroupItem
                  key={tab.id}
                  value={tab.id}
                  className="rounded-md"
                >
                  {tab.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>

            {filteredItems.length > 0 ? (
              <div className="grid gap-2 xl:grid-cols-2">
                {filteredItems.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    className="flex w-full animate-in items-start justify-between gap-3 rounded-xl border border-border/60 bg-background/80 p-3 text-left transition fade-in-0 slide-in-from-bottom-1 hover:border-primary/30 hover:bg-muted/40"
                    style={{ animationDelay: `${index * 35}ms` }}
                    onClick={() => onOpenItem(item.userId, item.jobId)}
                  >
                    <div className="flex min-w-0 flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-foreground">
                          {item.userName}
                        </p>
                        <Badge variant="outline">{item.groupLabel}</Badge>
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
              <Empty className="min-h-40 bg-muted/10" onClick={() => setActiveTab("all")}>
                <EmptyHeader>
                  <EmptyTitle>Aucune activité récente dans cet onglet</EmptyTitle>
                  <EmptyDescription>
                    Revenir à `Tout` pour afficher l&apos;ensemble des événements.
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
