import { format } from "date-fns";
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

function getApplicationSortTime(entry: JobApplication) {
  const candidates = [entry.appliedAt, entry.updatedAt, entry.job.publicationDate];

  for (const value of candidates) {
    if (!value) continue;
    const time = new Date(value).getTime();
    if (!Number.isNaN(time)) {
      return time;
    }
  }

  return 0;
}

export function sortApplicationsByMostRecent(applications: JobApplication[]) {
  return [...applications].sort(
    (left, right) => getApplicationSortTime(right) - getApplicationSortTime(left)
  );
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
