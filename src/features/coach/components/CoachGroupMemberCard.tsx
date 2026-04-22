"use client";

import React from "react";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CoachPhaseBadge } from "@/features/coach/components/CoachPhaseBadge";
import { CoachUserActivityMeta } from "@/features/coach/components/CoachUserActivityMeta";
import { CoachGroupedGroupKind, CoachRemoveMembershipTarget } from "@/features/coach/types";
import { getCoachUserDisplayName } from "@/features/coach/utils";
import { CoachUserSummary } from "@/types/coach";

interface CoachGroupMemberCardProps {
  entry: CoachUserSummary;
  groupId: number;
  groupName: string;
  groupKind: CoachGroupedGroupKind;
  onOpenUser: (userId: number) => void;
  onRemoveMembership: (target: CoachRemoveMembershipTarget) => void;
}

export const CoachGroupMemberCard = React.memo(function CoachGroupMemberCard({
  entry,
  groupId,
  groupName,
  groupKind,
  onOpenUser,
  onRemoveMembership,
}: CoachGroupMemberCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      className="min-w-0 rounded-xl border border-border/60 bg-background px-3 py-3 text-left transition-colors hover:border-primary/30 hover:bg-muted/30 sm:px-4"
      onClick={() => onOpenUser(entry.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpenUser(entry.id);
        }
      }}
    >
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="min-w-0 break-words font-medium">
                  {getCoachUserDisplayName(entry)}
                </p>
                <Badge variant="secondary" className="capitalize">
                  {entry.role}
                </Badge>
                <CoachPhaseBadge
                  phase={entry.trackingPhase}
                  hasAcceptedStage={entry.hasAcceptedStage}
                  hasAcceptedJob={entry.hasAcceptedJob}
                />
              </div>
            </div>
            {groupKind === "standard" ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="mt-[-2px] shrink-0"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  onClick={(event) => event.stopPropagation()}
                >
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={(event) => {
                      event.stopPropagation();
                      onRemoveMembership({
                        groupId,
                        userId: entry.id,
                        userEmail: entry.email,
                        groupName,
                      });
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Retirer du groupe
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
          <p className="break-all text-xs text-muted-foreground">
            {entry.email}
          </p>
          <p className="text-xs text-muted-foreground">
            {entry.groupNames.length > 0
              ? entry.groupNames.join(" • ")
              : "Sans groupe"}
          </p>
          <CoachUserActivityMeta
            user={entry}
            className="text-xs text-muted-foreground"
            firstItemClassName="mt-1 text-xs text-muted-foreground"
          />
        </div>
        <div className="grid min-w-0 gap-2 sm:min-w-[250px]">
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
            <div className="rounded-lg border border-border/60 bg-muted/10 px-2.5 py-2 text-center sm:px-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Candidatures
              </p>
              <p className="text-sm font-semibold text-foreground">
                {entry.applicationCount}
              </p>
            </div>
            <div className="rounded-lg border border-border/60 bg-[#EEF6FC] px-2.5 py-2 text-center dark:border-[#2A5573] dark:bg-[#10202B] sm:px-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Entretiens
              </p>
              <p className="text-sm font-semibold text-[#2E6E99] dark:text-sky-300">
                {entry.interviewCount}
              </p>
            </div>
            <div className="rounded-lg border border-border/60 bg-[#FFF5E8] px-2.5 py-2 text-center dark:border-[#6D4B1E] dark:bg-[#2A1D0F] sm:px-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Relances
              </p>
              <p className="text-sm font-semibold text-[#A46110] dark:text-amber-300">
                {entry.dueCount}
              </p>
            </div>
            <div className="rounded-lg border border-border/60 bg-background px-2.5 py-2 text-center sm:px-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Résultats
              </p>
              <div className="flex items-center justify-center gap-1 text-sm font-semibold text-foreground">
                <span className="text-[#2F7A3E] dark:text-emerald-300">
                  {entry.acceptedCount}
                </span>
                <span className="text-muted-foreground">/</span>
                <span className="text-[#C85A50] dark:text-rose-300">
                  {entry.rejectedCount}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
