"use client";

import { useState } from "react";
import { Check, CheckSquare, Download, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
    <Card className="border-border/60">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <CardTitle className="flex items-center gap-2 text-xl">
            Resultats de recherche
          </CardTitle>
          <CardDescription>
            {jobsCount} offre{jobsCount > 1 ? "s" : ""} trouvee{jobsCount > 1 ? "s" : ""}
            {selectedCount > 0 ? ` • ${selectedCount} selectionnee${selectedCount > 1 ? "s" : ""}` : ""}
          </CardDescription>
        </div>
      </CardHeader>

      {!isSearching && jobsCount > 0 ? (
        <CardContent className="flex flex-wrap gap-2 pt-0">
          <Button variant="outline" size="sm" className="rounded-full shadow-sm" onClick={onExportAll}>
            <Download data-icon="inline-start" />
            Exporter en CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full shadow-sm"
            onClick={handleCopy}
            disabled={!canCopySearchLink}
          >
            {copied ? <Check data-icon="inline-start" /> : <Link2 data-icon="inline-start" />}
            {copied ? "Lien copie" : "Copier la recherche"}
          </Button>
          {selectedCount > 0 ? (
            <Button
              variant="outline"
              size="sm"
              className="rounded-full shadow-sm"
              onClick={onExportSelected}
            >
              <CheckSquare data-icon="inline-start" />
              Exporter la selection
            </Button>
          ) : null}
        </CardContent>
      ) : null}
    </Card>
  );
}
