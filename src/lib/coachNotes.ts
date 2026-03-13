import {
  CoachNoteAuthor,
  CoachPrivateNote,
  CoachSharedNote,
  JobApplication,
} from "@/types/application";

type LegacyCoachNoteShape = JobApplication & {
  coachNote?: string;
  shareCoachNoteWithBeneficiary?: boolean;
};

const SYSTEM_AUTHOR: CoachNoteAuthor = {
  id: 0,
  firstName: "Historique",
  lastName: "",
  email: "",
  role: "system",
};

export function toCoachNoteAuthor(input: {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: "coach" | "admin";
}): CoachNoteAuthor {
  return {
    id: input.id,
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    role: input.role,
  };
}

function dedupeContributors(contributors: CoachNoteAuthor[]) {
  const seen = new Set<number>();
  return contributors.filter((entry) => {
    if (seen.has(entry.id)) return false;
    seen.add(entry.id);
    return true;
  });
}

function createLegacySharedNote(content: string, updatedAt: string): CoachSharedNote {
  return {
    id: "legacy-shared-note",
    content,
    createdAt: updatedAt,
    updatedAt,
    createdBy: SYSTEM_AUTHOR,
    contributors: [SYSTEM_AUTHOR],
  };
}

function createLegacyPrivateNote(content: string, updatedAt: string): CoachPrivateNote {
  return {
    content,
    createdAt: updatedAt,
    updatedAt,
    createdBy: SYSTEM_AUTHOR,
    contributors: [SYSTEM_AUTHOR],
  };
}

export function normalizeApplicationCoachNotes(application: JobApplication): JobApplication {
  const legacy = application as LegacyCoachNoteShape;
  const updatedAt = application.updatedAt || new Date().toISOString();
  const trimmedLegacyNote = legacy.coachNote?.trim();

  const privateCoachNote =
    application.privateCoachNote?.content.trim()
      ? {
          ...application.privateCoachNote,
          content: application.privateCoachNote.content.trim(),
          contributors: dedupeContributors(application.privateCoachNote.contributors ?? []),
        }
      : trimmedLegacyNote && !legacy.shareCoachNoteWithBeneficiary
        ? createLegacyPrivateNote(trimmedLegacyNote, updatedAt)
        : undefined;

  const sharedCoachNotes = (
    application.sharedCoachNotes?.filter((entry) => entry.content.trim()) ??
    (trimmedLegacyNote && legacy.shareCoachNoteWithBeneficiary
      ? [createLegacySharedNote(trimmedLegacyNote, updatedAt)]
      : [])
  ).map((entry) => ({
    ...entry,
    content: entry.content.trim(),
    contributors: dedupeContributors(entry.contributors ?? []),
  }));

  const next: LegacyCoachNoteShape = {
    ...application,
    privateCoachNote,
    sharedCoachNotes,
  };

  delete next.coachNote;
  delete next.shareCoachNoteWithBeneficiary;

  return next;
}

export function sanitizeApplicationForBeneficiary(application: JobApplication): JobApplication {
  const normalized = normalizeApplicationCoachNotes(application);
  return {
    ...normalized,
    privateCoachNote: undefined,
  };
}

export function preserveApplicationCoachFields(existing: JobApplication | null, next: JobApplication) {
  const normalizedNext = normalizeApplicationCoachNotes(next);
  if (!existing) {
    return normalizedNext;
  }

  const normalizedExisting = normalizeApplicationCoachNotes(existing);
  return {
    ...normalizedNext,
    privateCoachNote: normalizedNext.privateCoachNote ?? normalizedExisting.privateCoachNote,
    sharedCoachNotes:
      normalizedNext.sharedCoachNotes && normalizedNext.sharedCoachNotes.length > 0
        ? normalizedNext.sharedCoachNotes
        : normalizedExisting.sharedCoachNotes,
  };
}

export function formatCoachAuthorName(author: CoachNoteAuthor) {
  return `${author.firstName} ${author.lastName}`.trim() || author.email || "Historique";
}

export function summarizeCoachContributors(contributors: CoachNoteAuthor[]) {
  return dedupeContributors(contributors).map(formatCoachAuthorName).join(", ");
}
