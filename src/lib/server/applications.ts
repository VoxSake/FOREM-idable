import { addDays } from "date-fns";
import {
  parseStoredJobApplication,
  safeParseStoredJobApplication,
} from "@/lib/server/applicationSchemas";
import { db, ensureDatabase } from "@/lib/server/db";
import {
  preserveApplicationCoachFields,
  sanitizeApplicationForBeneficiary,
} from "@/lib/coachNotes";
import { ApplicationStatus, JobApplication } from "@/types/application";
import { Job } from "@/types/job";

function sanitizeText(value: string | undefined, fallback = "") {
  return (value || "").trim() || fallback;
}

function sanitizeOptionalText(value: string | undefined) {
  const trimmed = value?.trim() || "";
  return trimmed || undefined;
}

function sanitizeUrl(value: string | undefined, fallback = "#") {
  const trimmed = value?.trim() || "";
  if (!trimmed) return fallback;

  if (trimmed === "#") return "#";

  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : fallback;
  } catch {
    return fallback;
  }
}

function sanitizeJob(input: Job): Job {
  return {
    ...input,
    title: sanitizeText(input.title, "Sans intitulé"),
    company: sanitizeOptionalText(input.company),
    location: sanitizeText(input.location, "Non précisé"),
    contractType: sanitizeText(input.contractType, "Non précisé"),
    url: sanitizeUrl(input.url, "#"),
  };
}

function isManualJob(job: Job) {
  return job.url === "#" || job.id.startsWith("manual-");
}

function sortApplicationsByAppliedAt(applications: JobApplication[]) {
  return [...applications].sort((left, right) => {
    const leftTime = new Date(left.appliedAt).getTime();
    const rightTime = new Date(right.appliedAt).getTime();
    return (Number.isNaN(rightTime) ? 0 : rightTime) - (Number.isNaN(leftTime) ? 0 : leftTime);
  });
}

function buildApplication(job: Job): JobApplication {
  const now = new Date();

  return {
    job,
    appliedAt: now.toISOString(),
    followUpDueAt: addDays(now, 7).toISOString(),
    followUpEnabled: true,
    status: "in_progress",
    updatedAt: now.toISOString(),
  };
}

async function getStoredApplication(userId: number, jobId: string) {
  if (!db) throw new Error("Database unavailable");

  const result = await db.query<{ application: JobApplication }>(
    `SELECT application
     FROM user_applications
     WHERE user_id = $1 AND job_id = $2
     LIMIT 1`,
    [userId, jobId]
  );

  const stored = result.rows[0]?.application;
  return stored ? parseStoredJobApplication(stored, `user:${userId}:job:${jobId}`) : null;
}

async function getNextPosition(userId: number) {
  if (!db) throw new Error("Database unavailable");

  const result = await db.query<{ next_position: number }>(
    `SELECT COALESCE(MAX(position), -1) + 1 AS next_position
     FROM user_applications
     WHERE user_id = $1`,
    [userId]
  );

  return result.rows[0]?.next_position ?? 0;
}

export async function listApplicationsForUser(userId: number) {
  await ensureDatabase();
  if (!db) throw new Error("Database unavailable");

  const result = await db.query<{ application: JobApplication }>(
    `SELECT application
     FROM user_applications
     WHERE user_id = $1
     ORDER BY position ASC`,
    [userId]
  );

  return sortApplicationsByAppliedAt(
    result.rows
      .map((row, index) =>
        safeParseStoredJobApplication(row.application, `user:${userId}:position:${index}`)
      )
      .filter((entry): entry is JobApplication => Boolean(entry))
      .map((application) => sanitizeApplicationForBeneficiary(application))
  );
}

export async function createTrackedApplicationForUser(input: {
  userId: number;
  job: Job;
  appliedAt?: string;
  status?: ApplicationStatus;
  notes?: string;
  proofs?: string;
  interviewAt?: string;
  interviewDetails?: string;
}) {
  await ensureDatabase();
  if (!db) throw new Error("Database unavailable");

  const existing = await getStoredApplication(input.userId, input.job.id);
  const appliedAt = input.appliedAt ? new Date(input.appliedAt) : new Date();
  const normalizedAppliedAt = Number.isNaN(appliedAt.getTime()) ? new Date() : appliedAt;
  const sanitizedJob = sanitizeJob(input.job);

  const nextBase: JobApplication = existing
    ? {
        ...existing,
        job: sanitizedJob,
        appliedAt: input.appliedAt ?? existing.appliedAt,
        status: input.status ?? existing.status,
        notes: input.notes?.trim() ?? existing.notes,
        proofs: input.proofs?.trim() ?? existing.proofs,
        interviewAt: input.interviewAt ?? existing.interviewAt,
        interviewDetails: input.interviewDetails?.trim() ?? existing.interviewDetails,
        followUpEnabled: existing.followUpEnabled !== false,
        updatedAt: new Date().toISOString(),
      }
    : {
        ...buildApplication(sanitizedJob),
        appliedAt: normalizedAppliedAt.toISOString(),
        followUpDueAt: addDays(normalizedAppliedAt, 7).toISOString(),
        followUpEnabled: true,
        status: input.status ?? "in_progress",
        notes: input.notes?.trim(),
        proofs: input.proofs?.trim(),
        interviewAt: input.interviewAt,
        interviewDetails: input.interviewDetails?.trim(),
        updatedAt: new Date().toISOString(),
      };

  const next = preserveApplicationCoachFields(existing, nextBase);
  parseStoredJobApplication(next, `write:user:${input.userId}:job:${input.job.id}`);

  if (existing) {
    await db.query(
      `UPDATE user_applications
       SET application = $3::jsonb
       WHERE user_id = $1 AND job_id = $2`,
      [input.userId, input.job.id, JSON.stringify(next)]
    );
  } else {
    const position = await getNextPosition(input.userId);
    await db.query(
      `INSERT INTO user_applications (user_id, job_id, position, application)
       VALUES ($1, $2, $3, $4::jsonb)`,
      [input.userId, input.job.id, position, JSON.stringify(next)]
    );
  }

  return sanitizeApplicationForBeneficiary(next);
}

export async function updateApplicationForUser(input: {
  userId: number;
  jobId: string;
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
      | "followUpEnabled"
      | "appliedAt"
      | "job"
    >
  >;
}) {
  await ensureDatabase();
  if (!db) throw new Error("Database unavailable");

  const existing = await getStoredApplication(input.userId, input.jobId);
  if (!existing) {
    throw new Error("Application not found");
  }

  const nextPatch = { ...input.patch };
  if (nextPatch.job) {
    if (!isManualJob(existing.job)) {
      throw new Error("Manual job editing forbidden");
    }

    nextPatch.job = {
      ...existing.job,
      ...sanitizeJob(nextPatch.job),
      id: existing.job.id,
      source: existing.job.source,
      publicationDate: existing.job.publicationDate,
      pdfUrl: existing.job.pdfUrl,
      description: existing.job.description,
    };
  }

  if (typeof nextPatch.notes === "string") {
    nextPatch.notes = nextPatch.notes.trim();
  }

  if (typeof nextPatch.proofs === "string") {
    nextPatch.proofs = nextPatch.proofs.trim();
  }

  if (typeof nextPatch.interviewDetails === "string") {
    nextPatch.interviewDetails = nextPatch.interviewDetails.trim();
  }

  if (typeof nextPatch.followUpEnabled !== "boolean") {
    delete nextPatch.followUpEnabled;
  }

  const next = preserveApplicationCoachFields(existing, {
    ...existing,
    followUpEnabled: existing.followUpEnabled !== false,
    ...nextPatch,
    updatedAt: new Date().toISOString(),
  });
  parseStoredJobApplication(next, `write:user:${input.userId}:job:${input.jobId}`);

  await db.query(
    `UPDATE user_applications
     SET application = $3::jsonb
     WHERE user_id = $1 AND job_id = $2`,
    [input.userId, input.jobId, JSON.stringify(next)]
  );

  return sanitizeApplicationForBeneficiary(next);
}

export async function deleteApplicationForUser(userId: number, jobId: string) {
  await ensureDatabase();
  if (!db) throw new Error("Database unavailable");

  await db.query(
    `DELETE FROM user_applications
     WHERE user_id = $1 AND job_id = $2`,
    [userId, jobId]
  );
}
