"use client";

import { Badge } from "@/components/ui/badge";
import { JobApplication } from "@/types/application";
import { TrackingPhase } from "@/types/coach";

function isStageContract(contractType: string): boolean {
  const normalized = contractType.toUpperCase().trim();
  return normalized.includes("STAGE") || normalized.includes("STAGIAIRE");
}

function hasAcceptedStage(applications: JobApplication[]): boolean {
  return applications.some(
    (a) => a.status === "accepted" && isStageContract(a.job.contractType)
  );
}

function hasAcceptedJob(applications: JobApplication[]): boolean {
  return applications.some(
    (a) => a.status === "accepted" && !isStageContract(a.job.contractType)
  );
}

interface CoachPhaseBadgeProps {
  phase: TrackingPhase;
  applications?: JobApplication[];
  className?: string;
}

export function CoachPhaseBadge({
  phase,
  applications = [],
  className,
}: CoachPhaseBadgeProps) {
  if (phase === "placed") {
    return (
      <Badge variant="outline" className={className}>
        En emploi
      </Badge>
    );
  }

  if (phase === "dropped") {
    return (
      <Badge variant="destructive" className={className}>
        Sortie du dispositif
      </Badge>
    );
  }

  const hasJob = hasAcceptedJob(applications);
  const hasStage = hasAcceptedStage(applications);

  if (phase === "internship_search") {
    if (hasJob) {
      return (
        <Badge variant="success" className={className}>
          Sortie positive
        </Badge>
      );
    }
    if (hasStage) {
      return (
        <Badge variant="success" className={className}>
          Recherche stage
        </Badge>
      );
    }
    return (
      <Badge variant="default" className={className}>
        Recherche stage
      </Badge>
    );
  }

  if (phase === "job_search") {
    if (hasJob) {
      return (
        <Badge variant="success" className={className}>
          Sortie positive
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className={className}>
        Recherche emploi
      </Badge>
    );
  }

  return null;
}
