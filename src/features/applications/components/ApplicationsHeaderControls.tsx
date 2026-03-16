"use client";

import { CalendarDays, Download, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
      <div className="flex items-center gap-2 self-start sm:self-auto">
        <Button type="button" onClick={onCreateManual}>
          <Plus className="mr-2 h-4 w-4" />
          <span className="sm:hidden">Ajouter</span>
          <span className="hidden sm:inline">Ajouter manuellement</span>
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline">
              <MoreHorizontal className="h-4 w-4" />
              Actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={onExportCalendar} disabled={!canExportCalendar}>
              <CalendarDays className="h-4 w-4" />
              Export calendrier
            </DropdownMenuItem>
            {selectedCount > 0 ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={onRemoveSelected}>
                  <Trash2 className="h-4 w-4" />
                  Supprimer la sélection ({selectedCount})
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
