"use client";

import { BriefcaseBusiness, Clock3, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

interface ApplicationsEmptyStateProps {
  hasApplications: boolean;
  onCreateManual: () => void;
  onResetFilters: () => void;
}

export function ApplicationsEmptyState({
  hasApplications,
  onCreateManual,
  onResetFilters,
}: ApplicationsEmptyStateProps) {
  return (
    <Empty className="mt-8 min-h-96 bg-card">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <BriefcaseBusiness />
        </EmptyMedia>
        <EmptyTitle>
          {hasApplications
            ? "Aucune candidature ne correspond aux filtres actuels."
            : "Aucune candidature suivie pour le moment."}
        </EmptyTitle>
        <EmptyDescription>
          {hasApplications
            ? "Ajustez la recherche ou les filtres pour retrouver vos candidatures."
            : "Utilisez le bouton de candidature depuis les résultats ou encodez une candidature faite ailleurs."}
        </EmptyDescription>
      </EmptyHeader>

      {hasApplications ? (
        <Button type="button" variant="outline" onClick={onResetFilters}>
          Réinitialiser les filtres
        </Button>
      ) : (
        <EmptyContent>
          <Button type="button" onClick={onCreateManual}>
            <Plus data-icon="inline-start" />
            Encoder une candidature externe
          </Button>
        </EmptyContent>
      )}

      <div className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
        <Clock3 className="h-3.5 w-3.5" />
        Les relances sont mises en avant 7 jours après l&apos;envoi.
      </div>
    </Empty>
  );
}
