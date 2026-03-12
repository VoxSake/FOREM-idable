"use client";

import { CalendarDays, Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ApplicationsHeaderControlsProps {
  displayedCount: number;
  totalCount: number;
  dueCount: number;
  selectedCount: number;
  canExportCalendar: boolean;
  onCreateManual: () => void;
  onExportCsv: () => void;
  onExportCalendar: () => void;
  onRemoveSelected: () => void;
}

export function ApplicationsHeaderControls({
  displayedCount,
  totalCount,
  dueCount,
  selectedCount,
  canExportCalendar,
  onCreateManual,
  onExportCsv,
  onExportCalendar,
  onRemoveSelected,
}: ApplicationsHeaderControlsProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          {displayedCount} candidature{displayedCount > 1 ? "s" : ""} affichée
          {displayedCount > 1 ? "s" : ""}
          {displayedCount !== totalCount ? ` sur ${totalCount}` : ""}
        </p>
        <p className="text-sm font-medium text-foreground">
          {dueCount > 0 ? `${dueCount} relance${dueCount > 1 ? "s" : ""} à faire` : "Aucune relance urgente"}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={onCreateManual}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter manuellement
        </Button>
        <Button
          type="button"
          className="bg-emerald-600 text-white hover:bg-emerald-700"
          onClick={onExportCsv}
          disabled={displayedCount === 0}
        >
          <Download className="mr-2 h-4 w-4" />
          Export Excel
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onExportCalendar}
          disabled={!canExportCalendar}
        >
          <CalendarDays className="mr-2 h-4 w-4" />
          Export calendrier
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={onRemoveSelected}
          disabled={selectedCount === 0}
        >
          Supprimer la sélection
        </Button>
      </div>
    </div>
  );
}
