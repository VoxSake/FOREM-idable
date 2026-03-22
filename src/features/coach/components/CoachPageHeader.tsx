"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CoachPageHeaderProps {
  role: "coach" | "admin";
  feedback: string | null;
  undoLabel: string | null;
  onUndo: () => void;
}

export function CoachPageHeader({
  role,
  feedback,
  undoLabel,
  onUndo,
}: CoachPageHeaderProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-black tracking-tight">
            Suivi des bénéficiaires
          </h1>
          <Badge variant="secondary" className="capitalize">
            {role}
          </Badge>
        </div>
        <p className="text-lg text-muted-foreground">
          Vue d&apos;ensemble sur les personnes suivies, leurs groupes et leurs
          candidatures.
        </p>
      </div>

      {feedback || undoLabel ? (
        <Alert className="flex flex-wrap items-center justify-between gap-3">
          <AlertDescription>{feedback ?? undoLabel}</AlertDescription>
          {undoLabel ? (
            <Button type="button" size="sm" variant="outline" onClick={onUndo}>
              Annuler
            </Button>
          ) : null}
        </Alert>
      ) : null}
    </div>
  );
}
