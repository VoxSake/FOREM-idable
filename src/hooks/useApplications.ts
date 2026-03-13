"use client";

import { useCallback, useEffect, useState } from "react";
import { addDays } from "date-fns";
import { useAuth } from "@/components/auth/AuthProvider";
import { sortApplicationsByMostRecent } from "@/features/applications/utils";
import { ApplicationStatus, JobApplication } from "@/types/application";
import { Job } from "@/types/job";

function buildManualJob(input: {
  company: string;
  title: string;
  contractType: string;
  location: string;
  appliedAt?: string;
  url?: string;
}): Job {
  const baseDate = input.appliedAt ? new Date(input.appliedAt) : new Date();
  const appliedAt = Number.isNaN(baseDate.getTime()) ? new Date() : baseDate;

  return {
    id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: input.title,
    company: input.company,
    location: input.location || "Non précisé",
    contractType: input.contractType || "Non précisé",
    publicationDate: appliedAt.toISOString(),
    url: input.url || "#",
    source: "forem",
  };
}

export function useApplications() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setApplications([]);
      setIsLoaded(true);
      return;
    }

    setIsLoaded(false);

    try {
      const response = await fetch("/api/applications", { cache: "no-store" });
      const data = (await response.json()) as { applications?: JobApplication[] };
      setApplications(Array.isArray(data.applications) ? data.applications : []);
    } catch {
      setApplications([]);
    } finally {
      setIsLoaded(true);
    }
  }, [user]);

  const upsertApplication = useCallback((application: JobApplication) => {
    setApplications((current) => {
      const exists = current.some((entry) => entry.job.id === application.job.id);
      const next = exists
        ? current.map((entry) => (entry.job.id === application.job.id ? application : entry))
        : [...current, application];

      return sortApplicationsByMostRecent(next);
    });
  }, []);

  useEffect(() => {
    if (isAuthLoading) return;
    void refresh();
  }, [isAuthLoading, refresh]);

  const createApplication = useCallback(
    async (payload: {
      job: Job;
      appliedAt?: string;
      status?: ApplicationStatus;
      notes?: string;
      proofs?: string;
      interviewAt?: string;
      interviewDetails?: string;
    }) => {
      if (!user) return false;

      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        return false;
      }

      const data = (await response.json().catch(() => ({}))) as { application?: JobApplication };
      if (data.application) {
        upsertApplication(data.application);
      }
      return true;
    },
    [upsertApplication, user]
  );

  const patchApplication = useCallback(
    async (
      jobId: string,
      patch: Partial<
        Pick<
          JobApplication,
          | "status"
          | "notes"
          | "proofs"
          | "interviewAt"
          | "interviewDetails"
          | "lastFollowUpAt"
          | "followUpDueAt"
          | "appliedAt"
          | "job"
        >
      >
    ) => {
      if (!user) return false;

      const response = await fetch(`/api/applications/${encodeURIComponent(jobId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patch }),
      });

      if (!response.ok) {
        return false;
      }

      const data = (await response.json().catch(() => ({}))) as { application?: JobApplication };
      if (data.application) {
        upsertApplication(data.application);
      }
      return true;
    },
    [upsertApplication, user]
  );

  const addApplication = async (job: Job) => createApplication({ job });

  const addManualApplication = async (input: {
    company: string;
    title: string;
    contractType: string;
    location: string;
    appliedAt?: string;
    status?: ApplicationStatus;
    notes?: string;
    proofs?: string;
    url?: string;
  }) =>
    createApplication({
      job: buildManualJob(input),
      appliedAt: input.appliedAt,
      status: input.status,
      notes: input.notes,
      proofs: input.proofs,
    });

  const removeApplication = useCallback(
    async (jobId: string) => {
      if (!user) return false;

      const response = await fetch(`/api/applications/${encodeURIComponent(jobId)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        return false;
      }

      setApplications((current) => current.filter((entry) => entry.job.id !== jobId));
      return true;
    },
    [user]
  );

  const markAsRejected = (jobId: string) =>
    patchApplication(jobId, {
      status: "rejected",
      interviewAt: undefined,
      interviewDetails: undefined,
    });

  const markAsInProgress = (jobId: string) =>
    patchApplication(jobId, {
      status: "in_progress",
      interviewAt: undefined,
      interviewDetails: undefined,
    });

  const markAsAccepted = (jobId: string) =>
    patchApplication(jobId, {
      status: "accepted",
      interviewAt: undefined,
      interviewDetails: undefined,
    });

  const markAsFollowUp = (jobId: string) =>
    patchApplication(jobId, {
      status: "follow_up",
      interviewAt: undefined,
      interviewDetails: undefined,
    });

  const scheduleInterview = (jobId: string, interviewAt: string, interviewDetails?: string) =>
    patchApplication(jobId, {
      status: "interview",
      interviewAt,
      interviewDetails,
    });

  const clearInterview = async (jobId: string) => {
    const current = applications.find((entry) => entry.job.id === jobId);

    return patchApplication(jobId, {
      status: current?.status === "interview" ? "in_progress" : current?.status,
      interviewAt: undefined,
      interviewDetails: undefined,
    });
  };

  const saveNotes = (jobId: string, notes: string) => patchApplication(jobId, { notes });
  const saveProofs = (jobId: string, proofs: string) => patchApplication(jobId, { proofs });

  const markFollowUpDone = (jobId: string) => {
    const now = new Date();

    return patchApplication(jobId, {
      lastFollowUpAt: now.toISOString(),
      followUpDueAt: addDays(now, 7).toISOString(),
      status: "in_progress",
    });
  };

  const isApplied = useCallback(
    (jobId: string) => applications.some((entry) => entry.job.id === jobId),
    [applications]
  );

  return {
    applications,
    addApplication,
    addManualApplication,
    removeApplication,
    markAsRejected,
    markAsInProgress,
    markAsAccepted,
    markAsFollowUp,
    scheduleInterview,
    clearInterview,
    saveNotes,
    saveProofs,
    markFollowUpDone,
    isApplied,
    isLoaded,
    isAuthenticated: Boolean(user),
    isAuthLoading,
    refresh,
  };
}
