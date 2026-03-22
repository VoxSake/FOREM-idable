"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight, FolderKanban, History, Sparkles } from "lucide-react";

interface CoachPageHeaderProps {
  role: "coach" | "admin";
  undoLabel: string | null;
  onUndo: () => void;
}

export function CoachPageHeader({
  role,
  undoLabel,
  onUndo,
}: CoachPageHeaderProps) {
  const quickLinks = [
    { href: "#a-traiter", label: "Priorités", icon: Sparkles },
    { href: "#activite-recente", label: "Activité", icon: History },
    { href: "#groupes", label: "Groupes", icon: FolderKanban },
  ];

  return (
    <Card className="overflow-hidden border-border/60 bg-card py-0">
      <CardHeader className="gap-4 border-b border-border/60 px-6 py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="capitalize">
                {role}
              </Badge>
              <Badge variant="outline">Vue coach</Badge>
            </div>
            <div className="flex flex-col gap-2">
              <CardTitle className="text-3xl font-black tracking-tight">
                Suivi des bénéficiaires
              </CardTitle>
              <CardDescription className="max-w-3xl text-base text-muted-foreground">
                Vue d&apos;ensemble sur les personnes suivies, leurs groupes et
                leurs candidatures avec des raccourcis d&apos;action pour la
                démo et le pilotage quotidien.
              </CardDescription>
            </div>
          </div>

          <div className="grid min-w-[220px] gap-2 sm:grid-cols-3 sm:gap-2 lg:min-w-[360px]">
            {quickLinks.map((link) => {
              const Icon = link.icon;

              return (
                <Button
                  key={link.href}
                  asChild
                  variant="outline"
                  className="justify-between bg-card"
                >
                  <a href={link.href}>
                    <span className="inline-flex items-center gap-2">
                      <Icon data-icon="inline-start" />
                      {link.label}
                    </span>
                    <ArrowRight data-icon="inline-end" />
                  </a>
                </Button>
              );
            })}
          </div>
        </div>
      </CardHeader>

      {undoLabel ? (
        <CardContent className="px-6 py-4">
          <Alert className="flex flex-wrap items-center justify-between gap-3 border-border/60 bg-card">
            <AlertDescription>{undoLabel}</AlertDescription>
            {undoLabel ? (
              <Button type="button" size="sm" variant="outline" onClick={onUndo}>
                Annuler
              </Button>
            ) : null}
          </Alert>
        </CardContent>
      ) : null}
    </Card>
  );
}
