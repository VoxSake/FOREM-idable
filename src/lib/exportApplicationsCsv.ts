import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { JobApplication, ApplicationStatus } from "@/types/application";

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  in_progress: "En cours",
  follow_up: "Relance à faire",
  accepted: "Acceptée",
  rejected: "Refusée",
};

function formatDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return format(date, "dd/MM/yyyy", { locale: fr });
}

function escapeCSVCell(cell: string) {
  if (!cell) return '""';
  return `"${cell.replace(/"/g, '""').replace(/\n/g, " ")}"`;
}

export function exportApplicationsToCSV(applications: JobApplication[]) {
  if (!applications.length) return;

  const headers = [
    "Entreprise",
    "Intitulé",
    "Type",
    "Lieu",
    "Date envoyée",
    "Date relance",
    "Statut",
    "Notes",
    "Preuves",
    "Lien",
  ];

  const rows = applications.map((entry) =>
    [
      entry.job.company || "",
      entry.job.title,
      entry.job.contractType,
      entry.job.location,
      formatDate(entry.appliedAt),
      formatDate(entry.followUpDueAt),
      STATUS_LABELS[entry.status],
      entry.notes || "",
      entry.proofs || "",
      entry.job.url,
    ]
      .map(escapeCSVCell)
      .join(",")
  );

  const csvContent = [headers.join(","), ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `candidatures-foremidable-${format(new Date(), "yyyy-MM-dd")}.csv`
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
