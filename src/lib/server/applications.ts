import { addDays } from "date-fns";
import { db, ensureDatabase } from "@/lib/server/db";
import { ApplicationStatus, JobApplication } from "@/types/application";
import { Job } from "@/types/job";

function sanitizeForBeneficiary(application: JobApplication): JobApplication {
  if (application.shareCoachNoteWithBeneficiary) {
    return application;
  }

  return {
    ...application,
    coachNote: undefined,
  };
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

  return result.rows[0]?.application ?? null;
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

function preserveCoachFields(existing: JobApplication | null, next: JobApplication): JobApplication {
  if (!existing) return next;

  return {
    ...next,
    coachNote: existing.coachNote,
    shareCoachNoteWithBeneficiary: existing.shareCoachNoteWithBeneficiary,
  };
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
    result.rows.map((row) => sanitizeForBeneficiary(row.application))
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

  const nextBase: JobApplication = existing
    ? {
        ...existing,
        job: input.job,
        appliedAt: input.appliedAt ?? existing.appliedAt,
        status: input.status ?? existing.status,
        notes: input.notes ?? existing.notes,
        proofs: input.proofs ?? existing.proofs,
        interviewAt: input.interviewAt ?? existing.interviewAt,
        interviewDetails: input.interviewDetails ?? existing.interviewDetails,
        updatedAt: new Date().toISOString(),
      }
    : {
        ...buildApplication(input.job),
        appliedAt: normalizedAppliedAt.toISOString(),
        followUpDueAt: addDays(normalizedAppliedAt, 7).toISOString(),
        status: input.status ?? "in_progress",
        notes: input.notes,
        proofs: input.proofs,
        interviewAt: input.interviewAt,
        interviewDetails: input.interviewDetails,
        updatedAt: new Date().toISOString(),
      };

  const next = preserveCoachFields(existing, nextBase);

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

  return sanitizeForBeneficiary(next);
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

  const next = preserveCoachFields(existing, {
    ...existing,
    ...input.patch,
    updatedAt: new Date().toISOString(),
  });

  await db.query(
    `UPDATE user_applications
     SET application = $3::jsonb
     WHERE user_id = $1 AND job_id = $2`,
    [input.userId, input.jobId, JSON.stringify(next)]
  );

  return sanitizeForBeneficiary(next);
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
