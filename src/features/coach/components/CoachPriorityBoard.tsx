"use client";

import { BellRing, CalendarClock, CircleAlert, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { CoachPrioritySection } from "@/features/coach/utils";
import { cn } from "@/lib/utils";

interface CoachPriorityBoardProps {
  sections: CoachPrioritySection[];
  onOpenUser: (userId: number, jobId?: string | null) => void;
}

const SECTION_META: Record<
  CoachPrioritySection["id"],
  {
    icon: typeof CircleAlert;
    tone: "warning" | "info" | "danger";
  }
> = {
  due: {
    icon: CircleAlert,
    tone: "warning",
  },
  interviews: {
    icon: CalendarClock,
    tone: "info",
  },
  inactive: {
    icon: BellRing,
    tone: "danger",
  },
};

export function CoachPriorityBoard({ sections, onOpenUser }: CoachPriorityBoardProps) {
  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <h2 className="text-xl font-black tracking-tight">A traiter</h2>
        <p className="text-sm text-muted-foreground">
          Raccourcis coach pour les relances urgentes, les entretiens proches et les suivis à reprendre.
        </p>
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        {sections.map((section) => {
          const meta = SECTION_META[section.id];
          const Icon = meta.icon;

          return (
            <Card key={section.id} className="gap-0 py-0">
              <CardHeader className="border-b py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-primary" />
                      <CardTitle>{section.title}</CardTitle>
                    </div>
                    <p className="text-sm text-muted-foreground">{section.description}</p>
                  </div>
                  <Badge className={getPriorityBadgeClassName(meta.tone)}>{section.total}</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4">

              {section.items.length > 0 ? (
                <div className="space-y-2">
                  {section.items.slice(0, 5).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="flex w-full items-start justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 p-3 text-left transition hover:border-primary/30 hover:bg-muted/40"
                      onClick={() => onOpenUser(item.userId, item.jobId)}
                    >
                      <div className="min-w-0 space-y-1">
                        <p className="truncate font-medium text-foreground">{item.userName}</p>
                        <p className="text-sm text-muted-foreground">{item.summary}</p>
                        <p className="text-xs text-muted-foreground">{item.detail}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <Badge
                          variant="outline"
                          className="max-w-[10rem] truncate"
                          title={item.badgeTitle ?? item.badgeLabel}
                        >
                          {item.badgeLabel}
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </button>
                  ))}

                  {section.items.length > 5 ? (
                      <p className="px-1 text-xs text-muted-foreground">
                      {section.items.length - 5} autre
                      {section.items.length - 5 > 1 ? "s" : ""} bénéficiaire
                      {section.items.length - 5 > 1 ? "s" : ""} à traiter dans cette vue.
                    </p>
                  ) : null}
                </div>
              ) : (
                <Empty className="min-h-36 bg-muted/10 p-6">
                  <EmptyHeader>
                    <EmptyTitle>{section.emptyLabel}</EmptyTitle>
                    <EmptyDescription>Aucun élément prioritaire dans cette vue pour le moment.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

function getPriorityBadgeClassName(tone: "warning" | "info" | "danger") {
  return cn(
    "border hover:bg-transparent",
    tone === "warning" &&
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200",
    tone === "info" &&
      "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-200",
    tone === "danger" &&
      "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200"
  );
}
