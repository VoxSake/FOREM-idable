"use client";

import { useEffect, useState } from "react";
import { addDays } from "date-fns";
import { STORAGE_KEYS } from "@/lib/storageKeys";
import { Job } from "@/types/job";
import { ApplicationStatus, JobApplication } from "@/types/application";

const APPLICATIONS_CHANGE_EVENT = "forem-idable:applications-change";

function buildApplication(job: Job): JobApplication {
  const now = new Date();

  return {
    job,
    appliedAt: now.toISOString(),
    followUpDueAt: addDays(now, 7).toISOString(),
    status: "in_progress",
    updatedAt: now.toISOString(),
  };
}

export function useApplications() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const load = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.applications);
        if (stored) {
          const parsed = JSON.parse(stored) as JobApplication[];
          if (Array.isArray(parsed)) {
            setApplications(parsed);
            return;
          }
        }
        setApplications([]);
      } catch (error) {
        console.error("Failed to load applications", error);
      } finally {
        setIsLoaded(true);
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEYS.applications) {
        load();
      }
    };
    const handleChange = (event: Event) => {
      const nextApplications = (event as CustomEvent<JobApplication[]>).detail;
      if (Array.isArray(nextApplications)) {
        setApplications(nextApplications);
      }
    };

    load();
    window.addEventListener("storage", handleStorage);
    window.addEventListener(APPLICATIONS_CHANGE_EVENT, handleChange);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(APPLICATIONS_CHANGE_EVENT, handleChange);
    };
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    localStorage.setItem(STORAGE_KEYS.applications, JSON.stringify(applications));
    window.dispatchEvent(new CustomEvent(APPLICATIONS_CHANGE_EVENT, { detail: applications }));
  }, [applications, isLoaded]);

  const addApplication = (job: Job) => {
    setApplications((prev) => {
      const existing = prev.find((entry) => entry.job.id === job.id);
      if (existing) {
        return prev.map((entry) =>
          entry.job.id === job.id
            ? {
                ...entry,
                job,
                updatedAt: new Date().toISOString(),
              }
            : entry
        );
      }

      return [buildApplication(job), ...prev];
    });
  };

  const addManualApplication = (input: {
    company: string;
    title: string;
    contractType: string;
    location: string;
    appliedAt?: string;
    status?: ApplicationStatus;
    notes?: string;
    proofs?: string;
    url?: string;
  }) => {
    const baseDate = input.appliedAt ? new Date(input.appliedAt) : new Date();
    const appliedAt = Number.isNaN(baseDate.getTime()) ? new Date() : baseDate;
    const job: Job = {
      id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: input.title,
      company: input.company,
      location: input.location || "Non précisé",
      contractType: input.contractType || "Non précisé",
      publicationDate: appliedAt.toISOString(),
      url: input.url || "#",
      source: "forem",
    };

    setApplications((prev) => [
      {
        ...buildApplication(job),
        appliedAt: appliedAt.toISOString(),
        followUpDueAt: addDays(appliedAt, 7).toISOString(),
        status: input.status || "in_progress",
        notes: input.notes,
        proofs: input.proofs,
      },
      ...prev,
    ]);
  };

  const removeApplication = (jobId: string) => {
    setApplications((prev) => prev.filter((entry) => entry.job.id !== jobId));
  };

  const updateApplication = (jobId: string, updater: (entry: JobApplication) => JobApplication) => {
    setApplications((prev) =>
      prev.map((entry) => {
        if (entry.job.id !== jobId) return entry;
        return {
          ...updater(entry),
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const markAsRejected = (jobId: string) => {
    updateApplication(jobId, (entry) => ({
      ...entry,
      status: "rejected",
    }));
  };

  const markAsInProgress = (jobId: string) => {
    updateApplication(jobId, (entry) => ({
      ...entry,
      status: "in_progress",
    }));
  };

  const markAsAccepted = (jobId: string) => {
    updateApplication(jobId, (entry) => ({
      ...entry,
      status: "accepted",
    }));
  };

  const markAsFollowUp = (jobId: string) => {
    updateApplication(jobId, (entry) => ({
      ...entry,
      status: "follow_up",
    }));
  };

  const scheduleInterview = (jobId: string, interviewAt: string, interviewDetails?: string) => {
    updateApplication(jobId, (entry) => ({
      ...entry,
      status: "interview",
      interviewAt,
      interviewDetails,
    }));
  };

  const saveNotes = (jobId: string, notes: string) => {
    updateApplication(jobId, (entry) => ({
      ...entry,
      notes,
    }));
  };

  const saveProofs = (jobId: string, proofs: string) => {
    updateApplication(jobId, (entry) => ({
      ...entry,
      proofs,
    }));
  };

  const markFollowUpDone = (jobId: string) => {
    updateApplication(jobId, (entry) => {
      const now = new Date();

      return {
        ...entry,
        lastFollowUpAt: now.toISOString(),
        followUpDueAt: addDays(now, 7).toISOString(),
        status: "in_progress",
      };
    });
  };

  const isApplied = (jobId: string) => applications.some((entry) => entry.job.id === jobId);

  return {
    applications,
    addApplication,
    addManualApplication,
    removeApplication,
    updateApplication,
    markAsRejected,
    markAsInProgress,
    markAsAccepted,
    markAsFollowUp,
    scheduleInterview,
    saveNotes,
    saveProofs,
    markFollowUpDone,
    isApplied,
    isLoaded,
  };
}
