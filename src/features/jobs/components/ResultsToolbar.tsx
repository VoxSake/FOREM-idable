"use client";

import { useState } from "react";
import { Check, CheckSquare, Download, Link2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
    <Card className="border-border/60 bg-linear-to-br from-card to-muted/20">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="flex items-center gap-2 text-xl">
              Résultats de recherche
            </CardTitle>
            <Badge variant="secondary">{jobsCount}</Badge>
          </div>
          <CardDescription>
            {jobsCount} offre{jobsCount > 1 ? "s" : ""} trouvée{jobsCount > 1 ? "s" : ""}
            {selectedCount > 0 ? ` • ${selectedCount} sélectionnée${selectedCount > 1 ? "s" : ""}` : ""}
          </CardDescription>
        </div>
      </CardHeader>

      {!isSearching && jobsCount > 0 ? (
        <CardContent className="flex flex-col gap-2 pt-0 sm:flex-row sm:flex-wrap">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full shadow-sm sm:w-auto"
            onClick={onExportAll}
          >
            <Download data-icon="inline-start" />
            Exporter en CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full shadow-sm sm:w-auto"
            onClick={handleCopy}
            disabled={!canCopySearchLink}
          >
            {copied ? <Check data-icon="inline-start" /> : <Link2 data-icon="inline-start" />}
            {copied ? "Lien copié" : "Copier la recherche"}
          </Button>
          {selectedCount > 0 ? (
            <Button
              variant="outline"
              size="sm"
              className="rounded-full shadow-sm sm:w-auto"
              onClick={onExportSelected}
            >
              <CheckSquare data-icon="inline-start" />
              Exporter la sélection
            </Button>
          ) : null}
        </CardContent>
      ) : null}
    </Card>
  );
}
