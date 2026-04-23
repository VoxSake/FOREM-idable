"use client";

import { History, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoutJob } from "../scoutSchemas";

interface ScoutJobHistoryProps {
  jobs: ScoutJob[];
  activeJobId?: number;
  onSelect: (job: ScoutJob) => void;
  onDelete: (jobId: number) => void;
  onOpenHistory: () => void;
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
    case "queued": return { text: "En file", variant: "secondary" as const };
    case "pending": return { text: "En attente", variant: "warning" as const };
    case "running": return { text: "En cours", variant: "info" as const };
    case "completed": return { text: "Terminé", variant: "success" as const };
    case "failed": return { text: "Échec", variant: "error" as const };
  }
}

export function ScoutJobHistory({ jobs, activeJobId, onSelect, onDelete, onOpenHistory }: ScoutJobHistoryProps) {
  if (jobs.length === 0) return null;

  const recent = jobs.slice(0, 4);
  const remaining = Math.max(0, jobs.length - 4);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Historique</CardTitle>
        {remaining > 0 && (
          <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={onOpenHistory}>
            <History className="h-3.5 w-3.5" />
            Voir tout ({remaining})
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {recent.map((job) => {
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
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <Badge variant={status.variant} className="rounded px-1.5 py-0.5 text-[10px]">
                    {status.text}
                  </Badge>
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
        {remaining === 0 && jobs.length > 5 && (
          <Button type="button" variant="ghost" size="sm" className="w-full text-xs" onClick={onOpenHistory}>
            <History className="mr-1.5 h-3.5 w-3.5" />
            Voir tout l&apos;historique
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
