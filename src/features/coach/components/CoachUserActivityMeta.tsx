"use client";

import { Circle, Clock, UserCheck } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatCoachDate } from "@/features/coach/utils";
import { formatRelativeTime } from "@/features/coach/utils/relativeTime";
import { CoachUserSummary } from "@/types/coach";

interface CoachUserActivityMetaProps {
  user: Pick<CoachUserSummary, "role" | "lastSeenAt" | "lastCoachActionAt" | "latestActivityAt">;
  as?: "p" | "span";
  className?: string;
  firstItemClassName?: string;
  compact?: boolean;
}

function ActivityIconWithTooltip({
  icon: Icon,
  label,
  relative,
  absolute,
  className,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  relative: string;
  absolute: string;
  className?: string;
}) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={className}>
            <Icon className="mr-1 inline-block size-3 shrink-0" aria-hidden="true" />
            <span className="sr-only">{label}: </span>
            {relative}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={4}>
          {label}: {absolute}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function VerboseLine({
  label,
  value,
  as: Tag = "p",
  className,
}: {
  label: string;
  value: string;
  as?: "p" | "span";
  className?: string;
}) {
  return (
    <Tag className={className}>
      {label}: {value}
    </Tag>
  );
}

export function CoachUserActivityMeta({
  user,
  as = "p",
  className,
  firstItemClassName,
  compact = false,
}: CoachUserActivityMetaProps) {
  const Tag = as;

  const lastSeenAbsolute = formatCoachDate(user.lastSeenAt, true);
  const lastSeenRelative = formatRelativeTime(user.lastSeenAt);

  if (compact && lastSeenRelative && lastSeenAbsolute) {
    return (
      <div className={firstItemClassName ?? className}>
        <ActivityIconWithTooltip
          icon={Clock}
          label="Dernière connexion"
          relative={lastSeenRelative}
          absolute={lastSeenAbsolute}
          className={className}
        />
        {user.role === "coach" || user.role === "admin" ? (
          <ActivityIconWithTooltip
            icon={UserCheck}
            label="Dernière action coach"
            relative={formatRelativeTime(user.lastCoachActionAt) ?? "N/A"}
            absolute={formatCoachDate(user.lastCoachActionAt, true)}
            className={className}
          />
        ) : (
          <ActivityIconWithTooltip
            icon={Circle}
            label="Dernière activité"
            relative={formatRelativeTime(user.latestActivityAt) ?? "N/A"}
            absolute={formatCoachDate(user.latestActivityAt)}
            className={className}
          />
        )}
      </div>
    );
  }

  return (
    <>
      <Tag className={firstItemClassName ?? className}>
        Dernière connexion: {lastSeenAbsolute}
      </Tag>
      {user.role === "coach" || user.role === "admin" ? (
        <Tag className={className}>
          Dernière action coach: {formatCoachDate(user.lastCoachActionAt, true)}
        </Tag>
      ) : (
        <Tag className={className}>Dernière activité: {formatCoachDate(user.latestActivityAt)}</Tag>
      )}
    </>
  );
}
