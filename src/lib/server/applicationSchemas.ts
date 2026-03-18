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

export const jobApplicationSchema = z
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
  .passthrough();

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
    console.warn(`Skipping invalid stored application payload (${context})`);
    return null;
  }

  return parsed.data as JobApplication;
}
