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
              variant="outline"
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
