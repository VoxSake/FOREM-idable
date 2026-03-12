import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ApplicationStatus, JobApplication } from "@/types/application";

export interface CoachApplicationExportRow {
  userFirstName: string;
  userLastName: string;
  userEmail: string;
  groupName?: string;
  application?: JobApplication;
  message?: string;
}

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  in_progress: "En cours",
  follow_up: "Relance à faire",
  interview: "Entretien",
  accepted: "Acceptée",
  rejected: "Refusée",
};

function formatDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return format(date, "dd/MM/yyyy HH:mm", { locale: fr });
}

function escapeCSVCell(cell: string) {
  if (!cell) return '""';
  return `"${cell.replace(/"/g, '""').replace(/\n/g, " ")}"`;
}

export function exportCoachApplicationsToCSV(input: {
  filenamePrefix: string;
  rows: CoachApplicationExportRow[];
}) {
  if (!input.rows.length) return;

  const headers = [
    "Prénom",
    "Nom",
    "Utilisateur",
    "Groupe",
    "Entreprise",
    "Intitulé",
    "Type",
    "Lieu",
    "Date envoyée",
    "Date relance",
    "Dernière relance",
    "Date entretien",
    "Détails entretien",
    "Statut",
    "Notes",
    "Preuves",
    "Lien",
  ];

  const rows = input.rows.map(
    ({ userFirstName, userLastName, userEmail, groupName, application, message }) => {
      if (!application) {
        return [
          userFirstName,
          userLastName,
          userEmail,
          groupName || "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "Aucune candidature",
          message || "",
          "",
          "",
        ]
          .map(escapeCSVCell)
          .join(",");
      }

      return [
        userFirstName,
        userLastName,
        userEmail,
        groupName || "",
        application.job.company || "",
        application.job.title,
        application.job.contractType,
        application.job.location,
        formatDate(application.appliedAt),
        formatDate(application.followUpDueAt),
        formatDate(application.lastFollowUpAt),
        formatDate(application.interviewAt),
        application.interviewDetails || "",
        STATUS_LABELS[application.status],
        application.notes || "",
        application.proofs || "",
        application.job.url || "",
      ]
        .map(escapeCSVCell)
        .join(",");
    }
  );

  const csvContent = [headers.join(","), ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `${input.filenamePrefix}-${format(new Date(), "yyyy-MM-dd")}.csv`
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
