"use client";

import { Badge } from "@/components/ui/badge";
import { TrackingPhase } from "@/types/coach";

const PHASE_CONFIG: Record<TrackingPhase, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  internship_search: { label: "Recherche stage", variant: "default" },
  job_search: { label: "Recherche emploi", variant: "secondary" },
  placed: { label: "Placé", variant: "outline" },
  dropped: { label: "Abandonné", variant: "destructive" },
};

interface CoachPhaseBadgeProps {
  phase: TrackingPhase;
  className?: string;
}

export function CoachPhaseBadge({ phase, className }: CoachPhaseBadgeProps) {
  const config = PHASE_CONFIG[phase];
  if (!config) return null;

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
