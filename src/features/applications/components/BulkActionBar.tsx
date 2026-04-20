"use client";

import { BellOff, BellRing, Check, ChevronsUpDown, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { APPLICATION_STATUS_OPTIONS } from "@/features/applications/utils";
import { ApplicationStatus } from "@/types/application";

interface BulkActionBarProps {
  selectedCount: number;
  selectedFollowUpCount: number;
  selectedFollowUpDisabledCount: number;
  isAllSelected: boolean;
  onToggleSelectAll: () => void;
  onClearSelection: () => void;
  onDeleteSelected: () => void;
  onDisableFollowUp: () => void;
  onEnableFollowUp: () => void;
  onChangeStatus: (status: ApplicationStatus) => void;
}

export function BulkActionBar({
  selectedCount,
  selectedFollowUpCount,
  selectedFollowUpDisabledCount,
  isAllSelected,
  onToggleSelectAll,
  onClearSelection,
  onDeleteSelected,
  onDisableFollowUp,
  onEnableFollowUp,
  onChangeStatus,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <section
      role="toolbar"
      aria-label="Actions sur la sélection"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-6xl items-center gap-2 rounded-xl border bg-card/95 px-4 py-3 shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-card/85 animate-in slide-in-from-bottom-4 duration-300"
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="shrink-0 text-xs"
        onClick={onToggleSelectAll}
      >
        <Check data-icon="inline-start" />
        {isAllSelected ? "Tout désélectionner" : "Tout sélectionner"}
      </Button>

      <span className="text-sm font-medium tabular-nums">
        {selectedCount} sélectionnée{selectedCount > 1 ? "s" : ""}
      </span>

      <div className="ml-auto flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onEnableFollowUp}
          disabled={selectedFollowUpDisabledCount === 0}
        >
          <BellRing data-icon="inline-start" />
          <span className="hidden sm:inline">
            Réactiver{selectedFollowUpDisabledCount > 0 ? ` (${selectedFollowUpDisabledCount})` : ""}
          </span>
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onDisableFollowUp}
          disabled={selectedFollowUpCount === 0}
        >
          <BellOff data-icon="inline-start" />
          <span className="hidden sm:inline">
            Désactiver{selectedFollowUpCount > 0 ? ` (${selectedFollowUpCount})` : ""}
          </span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" size="sm">
              <ChevronsUpDown data-icon="inline-start" />
              <span className="hidden sm:inline">Statut</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {APPLICATION_STATUS_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onChangeStatus(option.value)}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={onDeleteSelected}
        >
          <Trash2 data-icon="inline-start" />
          <span className="hidden sm:inline">Supprimer</span>
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={onClearSelection}
          aria-label="Annuler la sélection"
        >
          <X />
        </Button>
      </div>
    </section>
  );
}