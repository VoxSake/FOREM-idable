import { z } from "zod";
import { Job } from "@/types/job";

export const applicationStatusSchema = z.enum([
  "in_progress",
  "follow_up",
  "interview",
  "accepted",
  "rejected",
]);

export const jobSourceSchema = z.enum(["forem", "linkedin", "indeed", "adzuna"]);

export const applicationJobPatchSchema = z
  .object({
    title: z.string().trim().min(1).optional(),
    company: z.string().trim().optional(),
    location: z.string().trim().optional(),
    contractType: z.string().trim().optional(),
    url: z.string().trim().optional(),
    publicationDate: z.string().trim().optional(),
    description: z.string().trim().optional(),
    source: jobSourceSchema.optional(),
    pdfUrl: z.string().trim().optional(),
  })
  .strict();

export const applicationPatchSchema = z
  .object({
    status: applicationStatusSchema.optional(),
    notes: z.string().optional().nullable(),
    proofs: z.string().optional().nullable(),
    interviewAt: z.string().optional().nullable(),
    interviewDetails: z.string().optional().nullable(),
    lastFollowUpAt: z.string().optional().nullable(),
    followUpDueAt: z.string().optional().nullable(),
    followUpEnabled: z.boolean().optional(),
    appliedAt: z.string().optional(),
    job: applicationJobPatchSchema.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Patch invalide.",
  });
export type ApplicationPatchInput = z.infer<typeof applicationPatchSchema>;

export const externalApplicationUpsertSchema = z
  .object({
    match: z.object({
      userId: z.number().int().positive(),
      jobId: z.string().trim().min(1),
    }),
    data: z
      .object({
        status: applicationStatusSchema.optional(),
        notes: z.string().optional().nullable(),
        proofs: z.string().optional().nullable(),
        interviewAt: z.string().optional().nullable(),
        interviewDetails: z.string().optional().nullable(),
        lastFollowUpAt: z.string().optional().nullable(),
        followUpDueAt: z.string().optional().nullable(),
        followUpEnabled: z.boolean().optional(),
        appliedAt: z.string().optional(),
        job: applicationJobPatchSchema.extend({
          title: z.string().trim().min(1),
        }),
      })
      .strict(),
  })
  .strict();
export type ExternalApplicationUpsertInput = z.infer<typeof externalApplicationUpsertSchema>;

export const textContentSchema = z
  .object({
    content: z.string(),
  })
  .strict();

export const coachNotesActionSchema = z
  .object({
    jobId: z.string().trim().min(1),
    action: z.enum(["save-private", "create-shared", "update-shared", "delete-shared"]),
    content: z.string().optional(),
    noteId: z.string().trim().min(1).optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (
      (value.action === "create-shared" || value.action === "update-shared") &&
      (!value.content || !value.content.trim())
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["content"],
        message: "Contenu de note partagée requis.",
      });
    }

    if (
      (value.action === "update-shared" || value.action === "delete-shared") &&
      !value.noteId
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["noteId"],
        message: "Identifiant de note requis.",
      });
    }
  });

export const coachImportRowSchema = z
  .object({
    company: z.string().optional(),
    contractType: z.string().optional(),
    title: z.string().optional(),
    location: z.string().optional(),
    appliedAt: z.string().optional(),
    status: applicationStatusSchema.optional(),
    notes: z.string().optional(),
  })
  .strict();

export const coachImportRequestSchema = z
  .object({
    dateFormat: z.enum(["dmy", "mdy"]).optional(),
    rows: z.array(coachImportRowSchema).min(1),
  })
  .strict();

export const patchEnvelopeSchema = z
  .object({
    patch: applicationPatchSchema,
  })
  .strict();

export function parseIntegerParam(value: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

export function normalizePatchedJob(jobId: string, job: z.infer<typeof applicationJobPatchSchema>): Job {
  return {
    id: jobId,
    title: job.title?.trim() || "",
    company: job.company?.trim() || undefined,
    location: job.location?.trim() || "Non précisé",
    contractType: job.contractType?.trim() || "Non précisé",
    publicationDate: job.publicationDate?.trim() || new Date().toISOString(),
    url: job.url?.trim() || "#",
    description: job.description?.trim() || undefined,
    source: job.source ?? "forem",
    pdfUrl: job.pdfUrl?.trim() || undefined,
  };
}

export function normalizeApplicationPatch(jobId: string, patch: ApplicationPatchInput) {
  return {
    status: patch.status,
    notes: patch.notes,
    proofs: patch.proofs,
    interviewAt: patch.interviewAt ?? undefined,
    interviewDetails: patch.interviewDetails ?? undefined,
    lastFollowUpAt: patch.lastFollowUpAt ?? undefined,
    followUpDueAt: patch.followUpDueAt ?? undefined,
    followUpEnabled: patch.followUpEnabled,
    appliedAt: patch.appliedAt,
    job: patch.job ? normalizePatchedJob(jobId, patch.job) : undefined,
  };
}
