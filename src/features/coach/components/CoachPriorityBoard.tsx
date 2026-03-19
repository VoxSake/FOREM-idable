"use client";

import { BellRing, CalendarClock, CircleAlert, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CoachPrioritySection } from "@/features/coach/utils";

interface CoachPriorityBoardProps {
  sections: CoachPrioritySection[];
  onOpenUser: (userId: number, jobId?: string | null) => void;
}

const SECTION_META: Record<
  CoachPrioritySection["id"],
  {
    icon: typeof CircleAlert;
    badgeClassName: string;
  }
> = {
  due: {
    icon: CircleAlert,
    badgeClassName:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200",
  },
  interviews: {
    icon: CalendarClock,
    badgeClassName:
      "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-200",
  },
  inactive: {
    icon: BellRing,
    badgeClassName:
      "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200",
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
            <div key={section.id} className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    <h3 className="font-bold">{section.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{section.description}</p>
                </div>
                <Badge className={meta.badgeClassName}>{section.total}</Badge>
              </div>

              {section.items.length > 0 ? (
                <div className="mt-4 space-y-2">
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
                <div className="mt-4 rounded-xl border border-dashed border-border/70 bg-muted/10 px-4 py-6 text-sm text-muted-foreground">
                  {section.emptyLabel}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
