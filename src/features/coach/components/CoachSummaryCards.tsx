"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
    {
      label: "Bénéficiaires suivis",
      value: String(userCount),
      detail: "Personnes actuellement pilotées",
      badge: "Portefeuille",
      badgeVariant: "secondary" as const,
    },
    {
      label: "Candidatures",
      value: String(totalApplications),
      detail: "Volume total consolidé",
      badge: "Pipeline",
      badgeVariant: "outline" as const,
    },
    {
      label: "Entretiens",
      value: String(totalInterviews),
      detail: "Échéances déjà planifiées",
      badge: "Agenda",
      badgeVariant: "outline" as const,
    },
    {
      label: "Relances",
      value: String(totalDue),
      detail: "Points à reprendre rapidement",
      badge: totalDue > 0 ? "À traiter" : "Stable",
      badgeVariant: totalDue > 0 ? ("destructive" as const) : ("secondary" as const),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
      {cards.map((card) => (
        <Card
          key={card.label}
          className="gap-0 border-border/60 bg-gradient-to-br from-background to-muted/30 py-0"
        >
          <CardHeader className="gap-3 px-4 py-4 md:px-5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 flex-col gap-1">
                <CardDescription className="text-xs md:text-sm">
                  {card.label}
                </CardDescription>
                <CardTitle className="text-2xl font-black md:text-3xl">
                  {card.value}
                </CardTitle>
              </div>
              <Badge variant={card.badgeVariant}>{card.badge}</Badge>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0 md:px-5">
            <p className="text-xs text-muted-foreground">{card.detail}</p>
          </CardContent>
        </Card>
      ))}
      <Card className="col-span-2 gap-0 border-border/60 bg-gradient-to-br from-background to-muted/30 py-0 md:col-span-1">
        <CardHeader className="gap-3 px-4 py-4 md:px-5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 flex-col gap-1">
              <CardDescription className="text-xs md:text-sm">
                Acceptées / refusées
              </CardDescription>
              <CardTitle className="text-2xl font-black md:text-3xl">
                {totalAccepted} / {totalRejected}
              </CardTitle>
            </div>
            <Badge variant="outline">Résultats</Badge>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0 md:px-5">
          <p className="text-xs text-muted-foreground">
            Lecture rapide du ratio de sorties positives et négatives.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
