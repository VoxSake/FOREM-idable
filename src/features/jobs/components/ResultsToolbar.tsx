"use client";

import { useState } from "react";
import { Check, CheckSquare, Download, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResultsToolbarProps {
  jobsCount: number;
  selectedCount: number;
  isSearching: boolean;
  onExportAll: () => void;
  onExportSelected: () => void;
  onCopySearchLink: () => Promise<void> | void;
  canCopySearchLink: boolean;
}

export function ResultsToolbar({
  jobsCount,
  selectedCount,
  isSearching,
  onExportAll,
  onExportSelected,
  onCopySearchLink,
  canCopySearchLink,
}: ResultsToolbarProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await onCopySearchLink();
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          Résultats de recherche
          <span className="inline-flex items-center rounded-full border border-orange-200 bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-800 dark:border-orange-800/60 dark:bg-orange-900/40 dark:text-orange-300">
            {jobsCount}
          </span>
        </h2>
        <span className="text-sm text-muted-foreground">
          {jobsCount} offre{jobsCount > 1 ? "s" : ""} trouvée{jobsCount > 1 ? "s" : ""}
        </span>
      </div>

      {!isSearching && jobsCount > 0 && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full border-orange-200 bg-orange-50 text-orange-900 shadow-sm hover:bg-orange-100 hover:text-orange-900 dark:border-orange-800/60 dark:bg-orange-950/30 dark:text-orange-200 dark:hover:bg-orange-900/40"
            onClick={onExportAll}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full shadow-sm"
            onClick={handleCopy}
            disabled={!canCopySearchLink}
          >
            {copied ? <Check className="w-4 h-4 mr-2" /> : <Link2 className="w-4 h-4 mr-2" />}
            {copied ? "Lien copié" : "Copier lien"}
          </Button>
          {selectedCount > 0 && (
            <Button
              variant="default"
              size="sm"
              className="rounded-full shadow-sm"
              onClick={onExportSelected}
            >
              <CheckSquare className="w-4 h-4 mr-2" />
              Export sélection
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
