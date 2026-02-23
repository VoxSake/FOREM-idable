import { Job } from "@/types/job";

export const MAX_COMPARE_ITEMS = 3;

export function toggleCompareJobs(current: Job[], nextJob: Job): Job[] {
  const exists = current.some((job) => job.id === nextJob.id);
  if (exists) return current.filter((job) => job.id !== nextJob.id);
  if (current.length >= MAX_COMPARE_ITEMS) return current;
  return [...current, nextJob];
}

