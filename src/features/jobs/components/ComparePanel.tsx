"use client";

import { CheckSquare, X } from "lucide-react";
import { Job } from "@/types/job";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ComparePanelProps {
  compareJobs: Job[];
  onReset: () => void;
  onRemove: (job: Job) => void;
}

export function ComparePanel({ compareJobs, onReset, onRemove }: ComparePanelProps) {
  if (compareJobs.length === 0) return null;

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <CheckSquare className="w-4 h-4" />
          S\u00e9lection ({compareJobs.length})
        </h2>
        <Button variant="ghost" size="sm" onClick={onReset}>
          Réinitialiser
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {compareJobs.map((job) => (
          <div key={job.id} className="rounded-lg border p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium text-sm leading-snug">{job.title}</p>
              <button
                type="button"
                onClick={() => onRemove(job)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Retirer de la s\u00e9lection"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline">{job.source}</Badge>
              <Badge variant="secondary">{job.contractType}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{job.location}</p>
            <p className="text-xs text-muted-foreground">
              {job.company || "Entreprise non précisée"}
            </p>
            <Button asChild size="sm" variant="outline" className="rounded-full">
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
