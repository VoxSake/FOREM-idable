import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ApplicationStatus, JobApplication } from "@/types/application";

export type ApplicationModeFilter = "all" | "due" | "interviews" | "manual";

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
