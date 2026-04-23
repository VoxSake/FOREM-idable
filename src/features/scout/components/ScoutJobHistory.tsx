"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoutJob } from "../scoutSchemas";

interface ScoutJobHistoryProps {
  jobs: ScoutJob[];
  activeJobId?: number;
  onSelect: (job: ScoutJob) => void;
  onDelete: (jobId: number) => void;
}

function formatDate(date: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-BE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(status: ScoutJob["status"]) {
  switch (status) {
    case "queued": return { text: "En file", className: "bg-gray-100 text-gray-800" };
    case "pending": return { text: "En attente", className: "bg-yellow-100 text-yellow-800" };
    case "running": return { text: "En cours", className: "bg-blue-100 text-blue-800" };
    case "completed": return { text: "Terminé", className: "bg-green-100 text-green-800" };
    case "failed": return { text: "Échec", className: "bg-red-100 text-red-800" };
  }
}

export function ScoutJobHistory({ jobs, activeJobId, onSelect, onDelete }: ScoutJobHistoryProps) {
  if (jobs.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Historique</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {jobs.map((job) => {
          const status = statusLabel(job.status);
          const isActive = job.id === activeJobId;
          return (
            <button
              key={job.id}
              onClick={() => onSelect(job)}
              className={`flex w-full min-w-0 items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                isActive ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
              }`}
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate font-medium">{job.query}</span>
                <span className="text-xs text-muted-foreground">
                  {job.radius >= 1000 ? `${(job.radius / 1000).toFixed(1)} km` : `${job.radius} m`} · {formatDate(job.createdAt)}
                </span>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium ${status.className}`}>
                    {status.text}
                  </span>
                  {job.status === "completed" && (
                    <span className="text-xs text-muted-foreground">{job.resultCount} résultats</span>
                  )}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={(e) => { e.stopPropagation(); onDelete(job.id); }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
