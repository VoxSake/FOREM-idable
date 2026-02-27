"use client";

import { useMemo, useState } from "react";
import { Job } from "@/types/job";
import { toggleCompareJobs } from "@/features/jobs/utils/compareJobs";

export function useCompareJobs() {
  const [compareJobs, setCompareJobs] = useState<Job[]>([]);

  const selectedCompareIds = useMemo(
    () => new Set(compareJobs.map((job) => job.id)),
    [compareJobs]
  );

  const toggleCompare = (job: Job) => {
    setCompareJobs((prev) => toggleCompareJobs(prev, job));
  };

  const resetCompare = () => setCompareJobs([]);

  return {
    compareJobs,
    selectedCompareIds,
    toggleCompare,
    resetCompare,
  };
}
