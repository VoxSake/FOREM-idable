"use client";

import { ShieldPlus, ShieldX } from "lucide-react";
import { UserPickerDialog } from "@/components/coach/UserPickerDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCoachUserDisplayName } from "@/features/coach/utils";
import { CoachUserSummary } from "@/types/coach";

interface CoachAdminSectionProps {
  coaches: CoachUserSummary[];
  promotableUsers: CoachUserSummary[];
  isPromoteCoachOpen: boolean;
  onPromoteCoachOpenChange: (open: boolean) => void;
  onPromoteCoach: (userId: number) => void;
  onDemoteCoach: (userId: number) => void;
}

export function CoachAdminSection({
  coaches,
  promotableUsers,
  isPromoteCoachOpen,
  onPromoteCoachOpenChange,
  onPromoteCoach,
  onDemoteCoach,
}: CoachAdminSectionProps) {
  return (
    <section className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Gestion des coachs</h2>
          <p className="text-sm text-muted-foreground">
            Promotion et rétrogradation globales des comptes coach.
          </p>
        </div>
        <Button type="button" onClick={() => onPromoteCoachOpenChange(true)}>
          <ShieldPlus className="mr-2 h-4 w-4" />
          Promouvoir un coach
        </Button>
      </div>

      <div className="space-y-3">
        {coaches.length > 0 ? (
          coaches.map((entry) => (
            <div
              key={entry.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/20 px-4 py-3"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{getCoachUserDisplayName(entry)}</p>
                  <Badge variant="secondary">coach</Badge>
                </div>
                <p className="break-all text-xs text-muted-foreground">{entry.email}</p>
                <p className="text-xs text-muted-foreground">
                  {entry.groupNames.length > 0
                    ? `Groupes: ${entry.groupNames.join(" • ")}`
                    : "Aucun groupe attribué"}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => onDemoteCoach(entry.id)}
              >
                <ShieldX className="mr-2 h-4 w-4" />
                Rétrograder
              </Button>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
            Aucun coach pour l&apos;instant.
          </div>
        )}
      </div>

      <UserPickerDialog
        open={isPromoteCoachOpen}
        onOpenChange={onPromoteCoachOpenChange}
        title="Promouvoir un utilisateur en coach"
        description="Seuls les comptes utilisateur classiques sont proposés ici."
        users={promotableUsers}
        onSelect={(entry) => onPromoteCoach(entry.id)}
      />
    </section>
  );
}
