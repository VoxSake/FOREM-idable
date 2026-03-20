import { z } from "zod";
import { JobApplication } from "@/types/application";

const jobSourceSchema = z.enum(["forem", "linkedin", "indeed", "adzuna"]);
const applicationStatusSchema = z.enum([
  "in_progress",
  "follow_up",
  "interview",
  "accepted",
  "rejected",
]);
const coachNoteAuthorRoleSchema = z.enum(["coach", "admin", "system"]);
const SYSTEM_AUTHOR = {
  id: 0,
  firstName: "Historique",
  lastName: "",
  email: "",
  role: "system" as const,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getOptionalString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function getRequiredString(value: unknown, fallback: string) {
  return typeof value === "string" ? value : fallback;
}

function normalizeCoachAuthor(value: unknown) {
  if (!isRecord(value)) {
    return SYSTEM_AUTHOR;
  }

  const rawId = typeof value.id === "number" ? value.id : Number(value.id);
  const rawRole = getOptionalString(value.role);

  return {
    id: Number.isFinite(rawId) ? rawId : SYSTEM_AUTHOR.id,
    firstName: getRequiredString(value.firstName, ""),
    lastName: getRequiredString(value.lastName, ""),
    email: getRequiredString(value.email, ""),
    role: coachNoteAuthorRoleSchema.safeParse(rawRole).success ? rawRole : SYSTEM_AUTHOR.role,
  };
}

function normalizePrivateCoachNote(value: unknown, fallbackTimestamp: string) {
  if (typeof value === "string") {
    const content = value.trim();
    return content
      ? {
          content,
          createdAt: fallbackTimestamp,
          updatedAt: fallbackTimestamp,
          createdBy: SYSTEM_AUTHOR,
          contributors: [SYSTEM_AUTHOR],
        }
      : undefined;
  }

  if (!isRecord(value)) {
    return value;
  }

  const content = getRequiredString(value.content, "").trim();
  if (!content) {
    return undefined;
  }

  const updatedAt = getRequiredString(value.updatedAt, fallbackTimestamp);
  const createdAt = getRequiredString(value.createdAt, updatedAt);
  const createdBy = normalizeCoachAuthor(value.createdBy);
  const contributors = Array.isArray(value.contributors)
    ? value.contributors.map(normalizeCoachAuthor)
    : [createdBy];

  return {
    ...value,
    content,
    createdAt,
    updatedAt,
    createdBy,
    contributors,
  };
}

function normalizeSharedCoachNotes(value: unknown, fallbackTimestamp: string) {
  if (!Array.isArray(value)) {
    return value;
  }

  return value
    .map((entry, index) => {
      if (typeof entry === "string") {
        const content = entry.trim();
        if (!content) return null;

        return {
          id: `legacy-shared-note-${index}`,
          content,
          createdAt: fallbackTimestamp,
          updatedAt: fallbackTimestamp,
          createdBy: SYSTEM_AUTHOR,
          contributors: [SYSTEM_AUTHOR],
        };
      }

      if (!isRecord(entry)) {
        return null;
      }

      const content = getRequiredString(entry.content, "").trim();
      if (!content) return null;

      const updatedAt = getRequiredString(entry.updatedAt, fallbackTimestamp);
      const createdAt = getRequiredString(entry.createdAt, updatedAt);
      const createdBy = normalizeCoachAuthor(entry.createdBy);
      const contributors = Array.isArray(entry.contributors)
        ? entry.contributors.map(normalizeCoachAuthor)
        : [createdBy];

      return {
        ...entry,
        id: getRequiredString(entry.id, `legacy-shared-note-${index}`),
        content,
        createdAt,
        updatedAt,
        createdBy,
        contributors,
      };
    })
    .filter((entry) => entry !== null);
}

function normalizeStoredApplicationPayload(value: unknown) {
  if (!isRecord(value)) {
    return value;
  }

  const fallbackTimestamp = getRequiredString(value.updatedAt, new Date().toISOString());

  return {
    ...value,
    privateCoachNote: normalizePrivateCoachNote(value.privateCoachNote, fallbackTimestamp),
    sharedCoachNotes: normalizeSharedCoachNotes(value.sharedCoachNotes, fallbackTimestamp),
  };
}

function extractStoredApplicationLogMetadata(value: unknown, context: string) {
  const jobId =
    isRecord(value) && isRecord(value.job) && typeof value.job.id === "string" ? value.job.id : null;

  const userIdMatch = context.match(/(?:^|:)user:(\d+)(?::|$)/);
  const coachDashboardMatch = context.match(/^coach-dashboard:(\d+)$/);
  const coachUpdateMatch = context.match(/^coach-update:(\d+):/);

  return {
    context,
    userId: userIdMatch?.[1] ?? coachDashboardMatch?.[1] ?? coachUpdateMatch?.[1] ?? null,
    jobId,
  };
}

const coachNoteAuthorSchema = z
  .object({
    id: z.number().int(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
    role: coachNoteAuthorRoleSchema,
  })
  .passthrough();

const coachSharedNoteSchema = z
  .object({
    id: z.string(),
    content: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    createdBy: coachNoteAuthorSchema,
    contributors: z.array(coachNoteAuthorSchema),
  })
  .passthrough();

const coachPrivateNoteSchema = z
  .object({
    content: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    createdBy: coachNoteAuthorSchema,
    contributors: z.array(coachNoteAuthorSchema),
  })
  .passthrough();

const jobSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    company: z.string().optional(),
    location: z.string(),
    contractType: z.string(),
    publicationDate: z.string(),
    url: z.string(),
    description: z.string().optional(),
    source: jobSourceSchema,
    pdfUrl: z.string().optional(),
  })
  .passthrough();

export const jobApplicationSchema = z.preprocess(
  normalizeStoredApplicationPayload,
  z
  .object({
    job: jobSchema,
    appliedAt: z.string(),
    followUpDueAt: z.string(),
    followUpEnabled: z.boolean().optional(),
    lastFollowUpAt: z.string().nullable().optional(),
    status: applicationStatusSchema,
    notes: z.string().nullable().optional(),
    proofs: z.string().nullable().optional(),
    privateCoachNote: coachPrivateNoteSchema.optional(),
    sharedCoachNotes: z.array(coachSharedNoteSchema).optional(),
    interviewAt: z.string().nullable().optional(),
    interviewDetails: z.string().nullable().optional(),
    updatedAt: z.string(),
  })
  .passthrough()
);

export function parseStoredJobApplication(value: unknown, context: string): JobApplication {
  const parsed = jobApplicationSchema.safeParse(value);
  if (!parsed.success) {
    throw new Error(`Invalid stored application payload (${context})`);
  }

  return parsed.data as JobApplication;
}

export function safeParseStoredJobApplication(value: unknown, context: string) {
  const parsed = jobApplicationSchema.safeParse(value);
  if (!parsed.success) {
    const metadata = extractStoredApplicationLogMetadata(value, context);
    console.warn("Skipping invalid stored application payload", {
      ...metadata,
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path.join(".") || "<root>",
        code: issue.code,
        message: issue.message,
      })),
    });
    return null;
  }

  return parsed.data as JobApplication;
}
