"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CoachSummaryCardsProps {
  userCount: number;
  totalApplications: number;
  totalInterviews: number;
  totalDue: number;
  totalAccepted: number;
  totalRejected: number;
}

export function CoachSummaryCards({
  userCount,
  totalApplications,
  totalInterviews,
  totalDue,
  totalAccepted,
  totalRejected,
}: CoachSummaryCardsProps) {
  const cards = [
    { label: "Bénéficiaires suivis", value: String(userCount) },
    { label: "Candidatures", value: String(totalApplications) },
    { label: "Entretiens", value: String(totalInterviews), tone: "info" as const },
    { label: "Relances", value: String(totalDue), tone: "warning" as const },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.label} className="gap-0 py-0">
          <CardContent className="p-3 md:p-4">
            <p className="text-xs text-muted-foreground md:text-sm">{card.label}</p>
            <p className={cn("mt-1 text-2xl font-black md:mt-2 md:text-3xl", getMetricToneClassName(card.tone))}>
              {card.value}
            </p>
          </CardContent>
        </Card>
      ))}
      <Card className="col-span-2 gap-0 py-0 md:col-span-1">
        <CardContent className="p-3 md:p-4">
          <p className="text-xs text-muted-foreground md:text-sm">Acceptées / refusées</p>
          <p className="mt-1 text-2xl font-black md:mt-2 md:text-3xl">
            <span className={getMetricToneClassName("success")}>{totalAccepted}</span>
            {" / "}
            <span className={getMetricToneClassName("danger")}>{totalRejected}</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function getMetricToneClassName(tone?: "info" | "warning" | "success" | "danger") {
  return cn(
    tone === "info" && "text-sky-700 dark:text-sky-300",
    tone === "warning" && "text-amber-700 dark:text-amber-300",
    tone === "success" && "text-emerald-700 dark:text-emerald-300",
    tone === "danger" && "text-rose-700 dark:text-rose-300"
  );
}
