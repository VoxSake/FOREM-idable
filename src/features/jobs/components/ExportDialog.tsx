"use client";

import { ExportColumnKey } from "@/lib/exportCsv";
import { EXPORTABLE_COLUMNS } from "@/features/jobs/constants/exportColumns";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exportTarget: "all" | "compare";
  jobsCount: number;
  compareCount: number;
  selectedColumns: ExportColumnKey[];
  onToggleColumn: (column: ExportColumnKey, checked: boolean) => void;
  onSelectAllColumns: () => void;
  onExport: () => void;
}

export function ExportDialog({
  open,
  onOpenChange,
  exportTarget,
  jobsCount,
  compareCount,
  selectedColumns,
  onToggleColumn,
  onSelectAllColumns,
  onExport,
}: ExportDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export CSV avancé</DialogTitle>
          <DialogDescription>
            Choisissez les colonnes à exporter. Les filtres de recherche actifs seront ajoutés en en-tête.
          </DialogDescription>
          <p className="text-xs text-muted-foreground">
            Portée:{" "}
            {exportTarget === "compare"
              ? `Comparateur (${compareCount} offre${compareCount > 1 ? "s" : ""})`
              : `Tous les résultats (${jobsCount})`}
          </p>
        </DialogHeader>

        <div className="space-y-2">
          {EXPORTABLE_COLUMNS.map((column) => {
            const checked = selectedColumns.includes(column.key);
            return (
              <label key={column.key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(event) => onToggleColumn(column.key, event.target.checked)}
                />
                <span>{column.label}</span>
              </label>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onSelectAllColumns}>
            Tout sélectionner
          </Button>
          <Button onClick={onExport} disabled={selectedColumns.length === 0}>
            Exporter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

