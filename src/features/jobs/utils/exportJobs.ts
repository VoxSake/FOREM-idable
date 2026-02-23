import { Job } from "@/types/job";
import { SearchQuery } from "@/types/search";

export type ExportTarget = "all" | "compare";

export function getExportScopeJobs(
  target: ExportTarget,
  jobs: Job[],
  compareJobs: Job[]
): Job[] {
  return target === "compare" ? compareJobs : jobs;
}

export function buildExportMetadata(options: {
  target: ExportTarget;
  jobsCount: number;
  searchQuery: SearchQuery | null;
  now?: Date;
}): Record<string, string> {
  const now = options.now || new Date();
  return {
    "Export généré le": now.toLocaleString("fr-BE"),
    "Mots-clés":
      options.searchQuery?.keywords.join(
        ` ${options.searchQuery?.booleanMode || "OU"} `
      ) || "Aucun",
    "Lieux":
      options.searchQuery?.locations.map((loc) => loc.name).join(" | ") || "Tous",
    "Mode booléen":
      options.searchQuery?.booleanMode === "AND" ? "ET" : "OU",
    "Nombre d'offres": String(options.jobsCount),
    "Portée export":
      options.target === "compare" ? "Comparateur" : "Tous les résultats",
  };
}

