import { format } from "date-fns";
import { isAfter } from "date-fns";
import { fr } from "date-fns/locale";
import { ApplicationStatus, JobApplication } from "@/types/application";

export type ApplicationModeFilter = "all" | "due" | "interviews" | "manual" | "coach_updates";

export function formatApplicationDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return format(date, "dd MMM yyyy", { locale: fr });
}

export function formatApplicationDateTime(value?: string) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return format(date, "dd MMM yyyy 'a' HH:mm", { locale: fr });
}

export function isFollowUpPending(status: ApplicationStatus) {
  return status === "in_progress" || status === "follow_up";
}

export function isFollowUpEnabled(application: Pick<JobApplication, "followUpEnabled">) {
  return application.followUpEnabled !== false;
}

export function isApplicationFollowUpDue(
  application: Pick<JobApplication, "status" | "followUpDueAt" | "followUpEnabled">
) {
  const due = new Date(application.followUpDueAt);
  return (
    isFollowUpPending(application.status) &&
    isFollowUpEnabled(application) &&
    !Number.isNaN(due.getTime()) &&
    !isAfter(due, new Date())
  );
}

export function shouldShowFollowUpDetails(status: ApplicationStatus) {
  return status !== "rejected" && status !== "accepted" && status !== "interview";
}

export function isManualApplication(entry: JobApplication) {
  return entry.job.url === "#" || entry.job.id.startsWith("manual-");
}

export function applicationStatusLabel(status: ApplicationStatus) {
  switch (status) {
    case "accepted":
      return "Acceptée";
    case "rejected":
      return "Refusée";
    case "interview":
      return "Entretien";
    case "follow_up":
      return "Relance à faire";
    case "in_progress":
    default:
      return "En cours";
  }
}

function parseTime(value?: string | null) {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

function getApplicationSortTime(entry: JobApplication) {
  const candidates = [entry.appliedAt, entry.updatedAt, entry.job.publicationDate];

  for (const value of candidates) {
    const time = parseTime(value);
    if (time !== null) {
      return time;
    }
  }

  return Number.NEGATIVE_INFINITY;
}

export function sortApplicationsByMostRecent(applications: JobApplication[]) {
  return [...applications].sort((left, right) => {
    const primaryDiff = getApplicationSortTime(right) - getApplicationSortTime(left);
    if (primaryDiff !== 0) return primaryDiff;

    const updatedDiff = (parseTime(right.updatedAt) ?? Number.NEGATIVE_INFINITY) - (parseTime(left.updatedAt) ?? Number.NEGATIVE_INFINITY);
    if (updatedDiff !== 0) return updatedDiff;

    return (parseTime(right.job.publicationDate) ?? Number.NEGATIVE_INFINITY) - (parseTime(left.job.publicationDate) ?? Number.NEGATIVE_INFINITY);
  });
}

export function getLatestSharedCoachNoteAt(application: JobApplication) {
  const timestamps = (application.sharedCoachNotes ?? [])
    .map((note) => note.updatedAt)
    .filter(Boolean)
    .map((value) => new Date(value).getTime())
    .filter((value) => !Number.isNaN(value));

  if (timestamps.length === 0) return null;
  return new Date(Math.max(...timestamps)).toISOString();
}
