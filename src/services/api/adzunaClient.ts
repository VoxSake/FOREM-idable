import { ForemSearchParams } from "./foremClient";
import { Job } from "@/types/job";

interface AdzunaSearchResponse {
  jobs: Job[];
  total: number;
  enabled: boolean;
}

export async function fetchAdzunaJobs(
  params: ForemSearchParams
): Promise<{ jobs: Job[]; total: number }> {
  try {
    const response = await fetch("/api/providers/adzuna/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      return { jobs: [], total: 0 };
    }

    const data = (await response.json()) as AdzunaSearchResponse;
    if (!data.enabled) {
      return { jobs: [], total: 0 };
    }

    return {
      jobs: Array.isArray(data.jobs) ? data.jobs : [],
      total: Number.isFinite(data.total) ? data.total : 0,
    };
  } catch (error) {
    console.error("Error fetching Adzuna jobs:", error);
    return { jobs: [], total: 0 };
  }
}

