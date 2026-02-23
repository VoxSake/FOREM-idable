import { Job } from "@/types/job";

export function exportJobsToCSV(jobs: Job[], filename = "offres-foremidable.csv") {
    if (!jobs || !jobs.length) return;

    const headers = [
        "Titre",
        "Entreprise",
        "Lieu",
        "Contrat",
        "Date de publication",
        "Lien",
        "Aperçu description",
    ];

    const escapeCSVCell = (cell: string) => {
        if (!cell) return '""';
        const cellStr = cell.replace(/"/g, '""').replace(/\n/g, " ");
        return `"${cellStr}"`;
    };

    const rows = jobs.map((job) => {
        return [
            escapeCSVCell(job.title),
            escapeCSVCell(job.company || ""),
            escapeCSVCell(job.location),
            escapeCSVCell(job.contractType),
            escapeCSVCell(job.publicationDate),
            escapeCSVCell(job.url),
            escapeCSVCell(job.description ? job.description.substring(0, 150) + "..." : ""),
        ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");

    // Create Blob and trigger download
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
