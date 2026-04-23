import { ScoutJobCreateInput, ScoutJob, ScoutResult } from "./scoutSchemas";

export async function createScoutJob(input: ScoutJobCreateInput): Promise<{ jobId: number }> {
  const res = await fetch("/api/scout/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Création impossible.");
  }
  return res.json();
}

export async function listScoutJobs(): Promise<{ jobs: ScoutJob[] }> {
  const res = await fetch("/api/scout/jobs");
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Chargement impossible.");
  }
  return res.json();
}

export async function getScoutJob(jobId: number): Promise<{ job: ScoutJob; results: ScoutResult[] }> {
  const res = await fetch(`/api/scout/jobs/${jobId}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Chargement impossible.");
  }
  return res.json();
}

export async function deleteScoutJob(jobId: number): Promise<void> {
  const res = await fetch(`/api/scout/jobs/${jobId}`, { method: "DELETE" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Suppression impossible.");
  }
}

export function openScoutStream(jobId: number): EventSource {
  return new EventSource(`/api/scout/jobs/${jobId}/stream`);
}
