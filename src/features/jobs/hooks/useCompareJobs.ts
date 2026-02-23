"use client";

import { useMemo, useState } from "react";
import { Job } from "@/types/job";
import { MAX_COMPARE_ITEMS, toggleCompareJobs } from "@/features/jobs/utils/compareJobs";

export function useCompareJobs() {
  const [compareJobs, setCompareJobs] = useState<Job[]>([]);

  const selectedCompareIds = useMemo(
    () => new Set(compareJobs.map((job) => job.id)),
    [compareJobs]
  );

  const canSelectMoreForCompare = compareJobs.length < MAX_COMPARE_ITEMS;

  const toggleCompare = (job: Job) => {
    setCompareJobs((prev) => toggleCompareJobs(prev, job));
  };

  const resetCompare = () => setCompareJobs([]);

  return {
    compareJobs,
    selectedCompareIds,
    canSelectMoreForCompare,
    toggleCompare,
    resetCompare,
  };
}
