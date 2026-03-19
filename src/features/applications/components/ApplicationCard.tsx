"use client";

import { addDays, isAfter, isBefore } from "date-fns";
import { CalendarDays, Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ContractTypeBadge } from "@/components/jobs/ContractTypeBadge";
import { ApplicationsOfferButtons } from "@/features/applications/components/ApplicationsOfferButtons";
import {
  applicationStatusLabel,
  formatApplicationDate,
  formatApplicationDateTime,
  getDisplayApplicationStatus,
  isFollowUpEnabled,
  isFollowUpPending,
  isManualApplication,
  shouldShowFollowUpDetails,
} from "@/features/applications/utils";
import { ApplicationStatus, JobApplication } from "@/types/application";

interface ApplicationCardProps {
  application: JobApplication;
  now: Date;
  isSelected: boolean;
  hasUnreadCoachUpdate: boolean;
  onToggleSelection: (jobId: string) => void;
  onOpenDetails: (jobId: string) => void;
  onApplyStatus: (jobId: string, status: ApplicationStatus) => void;
  onMarkFollowUpDone: (jobId: string) => void;
  onOpenInterview: (application: JobApplication) => void;
}

export function ApplicationCard({
  application,
  now,
  isSelected,
  hasUnreadCoachUpdate,
  onToggleSelection,
  onOpenDetails,
  onApplyStatus,
  onMarkFollowUpDone,
  onOpenInterview,
}: ApplicationCardProps) {
  const followUpDue = new Date(application.followUpDueAt);
  const interviewDate = application.interviewAt ? new Date(application.interviewAt) : null;
  const hasInterview = Boolean(interviewDate) && !Number.isNaN(interviewDate!.getTime());
  const followUpEnabled = isFollowUpEnabled(application);
  const isDue =
    isFollowUpPending(application.status) &&
    followUpEnabled &&
    !Number.isNaN(followUpDue.getTime()) &&
    !isAfter(followUpDue, now);
  const isSoon =
    isFollowUpPending(application.status) &&
    followUpEnabled &&
    !Number.isNaN(followUpDue.getTime()) &&
    isAfter(followUpDue, now) &&
    isBefore(followUpDue, addDays(now, 2));
  const displayStatus = getDisplayApplicationStatus(application);

  return (
    <div
      className={`rounded-xl border bg-card p-4 shadow-sm cursor-pointer transition-colors hover:bg-muted/20 ${
        application.status === "accepted"
          ? "border-emerald-300 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/20"
          : application.status === "rejected"
            ? "border-rose-300 bg-rose-50/60 dark:border-rose-900 dark:bg-rose-950/20"
          : hasInterview
            ? "border-sky-300 bg-sky-50/60 dark:border-sky-900 dark:bg-sky-950/20"
            : hasUnreadCoachUpdate
              ? "border-sky-300 bg-sky-50/50 dark:border-sky-900 dark:bg-sky-950/20"
            : isDue
              ? "border-amber-400/70"
              : ""
      }`}
      onClick={() => onOpenDetails(application.job.id)}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 shrink-0 accent-primary cursor-pointer"
          checked={isSelected}
          onChange={() => onToggleSelection(application.job.id)}
          onClick={(event) => event.stopPropagation()}
          aria-label="Sélectionner la candidature"
        />

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-col gap-3">
            <div className="min-w-0 text-left">
              <p className="truncate font-semibold leading-snug hover:text-primary">
                {application.job.company || "Entreprise non précisée"}
              </p>
              <p className="line-clamp-2 text-sm text-muted-foreground">{application.job.title}</p>
              <p className="text-xs text-muted-foreground">{application.job.location}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <ContractTypeBadge contractType={application.job.contractType || "N/A"} />
              {isManualApplication(application) ? (
                <Badge variant="secondary">
                  Manuelle
                </Badge>
              ) : (
                <Badge variant="secondary">
                  Importée
                </Badge>
              )}
              {application.sharedCoachNotes && application.sharedCoachNotes.length > 0 ? (
                <Badge variant="secondary">
                  {hasUnreadCoachUpdate ? "Nouveau" : "Retour coach"}
                </Badge>
              ) : null}
              <Badge variant={isDue ? "destructive" : "secondary"}>
                {applicationStatusLabel(displayStatus)}
              </Badge>
              <Badge variant="outline">Envoyée le {formatApplicationDate(application.appliedAt)}</Badge>
              {hasInterview ? <Badge variant="secondary">Entretien {formatApplicationDateTime(application.interviewAt ?? undefined)}</Badge> : null}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Select
              value={displayStatus}
              onValueChange={(value) => onApplyStatus(application.job.id, value as ApplicationStatus)}
            >
              <SelectTrigger
                className="w-full"
                onClick={(event) => event.stopPropagation()}
              >
                <SelectValue placeholder="Choisir un statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="follow_up">Relance à faire</SelectItem>
                  <SelectItem value="interview">Entretien</SelectItem>
                  <SelectItem value="accepted">Acceptée</SelectItem>
                  <SelectItem value="rejected">Refusée</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <ApplicationsOfferButtons application={application} />

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-full"
              onClick={(event) => {
                event.stopPropagation();
                onOpenDetails(application.job.id);
              }}
            >
              Détails
            </Button>

            <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
              {shouldShowFollowUpDetails(application.status) ? (
                <>
                  {followUpEnabled ? (
                    <>
                      <p>Relance: {formatApplicationDate(application.followUpDueAt)}</p>
                      {isSoon ? <p>Bientôt</p> : null}
                      {application.lastFollowUpAt ? (
                        <p>Dernière: {formatApplicationDate(application.lastFollowUpAt)}</p>
                      ) : null}
                    </>
                  ) : (
                    <p>Relance désactivée.</p>
                  )}
                </>
              ) : (
                <p>Aucune relance automatique sur une candidature clôturée.</p>
              )}
              {hasInterview ? (
                <p>Entretien: {formatApplicationDateTime(application.interviewAt ?? undefined)}</p>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 w-full"
                onClick={(event) => {
                  event.stopPropagation();
                  onMarkFollowUpDone(application.job.id);
                }}
                disabled={application.status === "accepted"}
              >
                <Clock3 data-icon="inline-start" />
                Relancer
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 w-full"
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenInterview(application);
                }}
                disabled={application.status === "accepted" || application.status === "rejected"}
              >
                <CalendarDays data-icon="inline-start" />
                Entretien
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
