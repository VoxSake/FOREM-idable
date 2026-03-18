"use client";

import { formatCoachDate } from "@/features/coach/utils";
import { CoachUserSummary } from "@/types/coach";

interface CoachUserActivityMetaProps {
  user: Pick<CoachUserSummary, "role" | "lastSeenAt" | "lastCoachActionAt" | "latestActivityAt">;
  as?: "p" | "span";
  className?: string;
  firstItemClassName?: string;
}

export function CoachUserActivityMeta({
  user,
  as = "p",
  className,
  firstItemClassName,
}: CoachUserActivityMetaProps) {
  const Tag = as;

  return (
    <>
      <Tag className={firstItemClassName ?? className}>
        Dernière connexion: {formatCoachDate(user.lastSeenAt, true)}
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
