"use client";

import { Download, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResultsToolbarProps {
  jobsCount: number;
  compareCount: number;
  isSearching: boolean;
  onExportAll: () => void;
  onExportCompare: () => void;
}

export function ResultsToolbar({
  jobsCount,
  compareCount,
  isSearching,
  onExportAll,
  onExportCompare,
}: ResultsToolbarProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">Résultats de recherche</h2>
        <span className="text-sm text-muted-foreground">
          {jobsCount} offre{jobsCount > 1 ? "s" : ""} trouvée{jobsCount > 1 ? "s" : ""}
        </span>
      </div>

      {!isSearching && jobsCount > 0 && (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-full shadow-sm" onClick={onExportAll}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          {compareCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-full shadow-sm"
              onClick={onExportCompare}
            >
              <Scale className="w-4 h-4 mr-2" />
              Export comparateur
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

