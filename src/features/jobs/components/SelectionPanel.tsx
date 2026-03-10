"use client";

import { CheckSquare, X } from "lucide-react";
import { Job } from "@/types/job";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SelectionPanelProps {
  selectedJobs: Job[];
  onReset: () => void;
  onRemove: (job: Job) => void;
}

export function SelectionPanel({ selectedJobs, onReset, onRemove }: SelectionPanelProps) {
  if (selectedJobs.length === 0) return null;

  return (
    <div className="rounded-xl border border-orange-200/70 bg-gradient-to-br from-card via-card to-orange-50/50 p-4 space-y-3 dark:border-orange-900/50 dark:to-orange-950/10">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold flex items-center gap-2 text-foreground">
          <CheckSquare className="w-4 h-4 text-orange-600 dark:text-orange-300" />
          Sélection ({selectedJobs.length})
        </h2>
        <Button variant="ghost" size="sm" onClick={onReset}>
          Réinitialiser
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {selectedJobs.map((job) => (
          <div key={job.id} className="rounded-lg border border-border/80 bg-background/70 p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium text-sm leading-snug">{job.title}</p>
              <button
                type="button"
                onClick={() => onRemove(job)}
                className="text-muted-foreground hover:text-orange-600 dark:hover:text-orange-300"
                aria-label="Retirer de la sélection"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="border-primary/25 bg-primary/8 text-primary dark:bg-primary/12">
                {job.source}
              </Badge>
              <Badge className="bg-orange-500 text-white hover:bg-orange-500/90 dark:bg-orange-500 dark:text-white">
                {job.contractType}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{job.location}</p>
            <p className="text-xs text-muted-foreground">
              {job.company || "Entreprise non précisée"}
            </p>
            <Button asChild size="sm" variant="outline" className="rounded-full border-orange-200 hover:bg-orange-50 dark:border-orange-800/60 dark:hover:bg-orange-950/30">
              <a href={job.url} target="_blank" rel="noopener noreferrer">
                Voir l&apos;offre
              </a>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
