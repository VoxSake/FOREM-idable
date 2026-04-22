import { isAfter } from "date-fns";
import {
  formatCoachAuthorName,
  summarizeCoachContributors,
  toCoachNoteAuthor,
} from "@/lib/coachNotes";
import { canAccessCoachUser, getCoachDashboard } from "@/lib/server/coach";
import { db } from "@/lib/server/db";
import { inferApplicationSourceType } from "@/lib/applications/sourceType";
import { saveApplicationToRelationalStore } from "@/lib/server/applicationStore";
import { escapeCsvCell } from "@/lib/csv";
import {
  ExternalApiActor,
  ExternalApiApplicationDetail,
  ExternalApiApplicationRow,
  ExternalApiFilters,
  ExternalApiGroupCoachSummary,
  ExternalApiStats,
  ExternalApiUserSummary,
} from "@/types/externalApi";
import { ApplicationStatus, JobApplication } from "@/types/application";
import { CoachGroupMember, CoachUserSummary } from "@/types/coach";
import { Job } from "@/types/job";
import { RelationalApplicationRecord } from "@/lib/server/applicationStore";

export function matchesSearch(haystack: string[], search?: string) {
  const normalized = search?.trim().toLowerCase();
  if (!normalized) return true;
  return haystack.join(" ").toLowerCase().includes(normalized);
}

export function isDue(status: ApplicationStatus, dueAt: string, followUpEnabled?: boolean) {
  const due = new Date(dueAt);
  return (
    (status === "in_progress" || status === "follow_up") &&
    followUpEnabled !== false &&
    !Number.isNaN(due.getTime()) &&
    !isAfter(due, new Date())
  );
}

export function isInterviewScheduled(interviewAt?: string | null) {
  if (!interviewAt) {
    return false;
  }

  const interviewDate = new Date(interviewAt);
  return !Number.isNaN(interviewDate.getTime());
}

export function buildStats(
  users: Array<
    Pick<
      ExternalApiUserSummary,
      "groupIds" | "applicationCount" | "interviewCount" | "dueCount"
    >
  >
): ExternalApiStats {
  return {
    userCount: users.length,
    groupCount: new Set(users.flatMap((entry) => entry.groupIds)).size,
    applicationCount: users.reduce((sum, entry) => sum + entry.applicationCount, 0),
    interviewCount: users.reduce((sum, entry) => sum + entry.interviewCount, 0),
    dueCount: users.reduce((sum, entry) => sum + entry.dueCount, 0),
  };
}

export function normalizeLimit(value: number | undefined, fallback: number) {
  if (!value || !Number.isFinite(value)) return fallback;
  return Math.max(1, Math.min(500, Math.floor(value)));
}

export function normalizeOffset(value: number | undefined) {
  if (!value || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

export function toExternalUserSummary(
  user: CoachUserSummary,
  includeApplications: boolean
): ExternalApiUserSummary {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: `${user.firstName} ${user.lastName}`.trim() || user.email,
    role: user.role,
    trackingPhase: user.trackingPhase,
    groupIds: user.groupIds,
    groupNames: user.groupNames,
    applicationCount: user.applicationCount,
    interviewCount: user.interviewCount,
    dueCount: user.dueCount,
    acceptedCount: user.acceptedCount,
    rejectedCount: user.rejectedCount,
    inProgressCount: user.inProgressCount,
    latestActivityAt: user.latestActivityAt,
    applications: includeApplications ? user.applications : undefined,
  };
}

export function toExternalGroupCoachSummary(
  coach: CoachGroupMember,
  managerCoachId: number | null
): ExternalApiGroupCoachSummary {
  return {
    id: coach.id,
    email: coach.email,
    firstName: coach.firstName,
    lastName: coach.lastName,
    fullName: `${coach.firstName} ${coach.lastName}`.trim() || coach.email,
    role: coach.role === "admin" ? "admin" : "coach",
    isManager: managerCoachId === coach.id,
  };
}

export async function loadDashboard(
  actor: ExternalApiActor,
  filters?: {
    userId?: number | null;
    groupId?: number | null;
    role?: ExternalApiFilters["role"];
    search?: string | null;
  }
) {
  return getCoachDashboard(actor, filters);
}

export function formatNoteContributors(application: JobApplication) {
  return (application.sharedCoachNotes ?? [])
    .map((note) => summarizeCoachContributors(note.contributors))
    .join(" | ");
}

export function formatSharedNotes(application: JobApplication) {
  return (application.sharedCoachNotes ?? [])
    .map((note) => `${formatCoachAuthorName(note.createdBy)}: ${note.content}`)
    .join(" | ");
}

export function toApplicationRow(
  record: RelationalApplicationRecord,
  user: CoachUserSummary
): ExternalApiApplicationRow {
  return {
    applicationId: record.applicationId,
    userId: user.id,
    userEmail: user.email,
    userFirstName: user.firstName,
    userLastName: user.lastName,
    userRole: user.role,
    groupIds: user.groupIds,
    groupNames: user.groupNames,
    isFollowUpDue: isDue(
      record.application.status,
      record.application.followUpDueAt,
      record.application.followUpEnabled
    ),
    isInterviewScheduled: isInterviewScheduled(record.application.interviewAt),
    application: record.application,
  };
}

export function toApplicationDetail(
  record: RelationalApplicationRecord,
  user: CoachUserSummary
): ExternalApiApplicationDetail {
  return toApplicationRow(record, user);
}

export function matchesApplicationFilters(row: ExternalApiApplicationRow, filters: ExternalApiFilters) {
  if (filters.userId && row.userId !== filters.userId) return false;
  if (filters.groupId && !row.groupIds.includes(filters.groupId)) return false;
  if (filters.role && row.userRole !== filters.role) return false;
  if (filters.status && row.application.status !== filters.status) return false;
  if (
    filters.dueOnly &&
    !isDue(
      row.application.status,
      row.application.followUpDueAt,
      row.application.followUpEnabled
    )
  ) {
    return false;
  }
  if (filters.interviewOnly && row.application.status !== "interview") return false;
  if (filters.updatedAfter && row.application.updatedAt < filters.updatedAfter) return false;
  if (filters.updatedBefore && row.application.updatedAt > filters.updatedBefore) return false;
  if (filters.appliedAfter && row.application.appliedAt < filters.appliedAfter) return false;
  if (filters.appliedBefore && row.application.appliedAt > filters.appliedBefore) return false;
  if (filters.hasPrivateNote && !row.application.privateCoachNote?.content.trim()) return false;
  if (filters.hasSharedNotes && (row.application.sharedCoachNotes?.length ?? 0) === 0) return false;

  return matchesSearch(
    [
      row.userFirstName,
      row.userLastName,
      `${row.userFirstName} ${row.userLastName}`.trim(),
      row.userEmail,
      row.application.job.company || "",
      row.application.job.title,
      row.application.job.location,
      row.groupNames.join(" "),
      row.application.notes || "",
      row.application.proofs || "",
      row.application.privateCoachNote?.content || "",
      row.application.privateCoachNote
        ? summarizeCoachContributors(row.application.privateCoachNote.contributors)
        : "",
      formatSharedNotes(row.application),
      formatNoteContributors(row.application),
    ],
    filters.search
  );
}

export function sanitizeApplicationForList(
  row: ExternalApiApplicationRow,
  filters: ExternalApiFilters
): ExternalApiApplicationRow {
  if (
    filters.includePrivateNote ||
    filters.includeSharedNotes ||
    filters.includeContributors
  ) {
    return row;
  }

  return {
    ...row,
    application: {
      ...row.application,
      privateCoachNote: undefined,
      sharedCoachNotes: [],
    },
  };
}

export async function getScopedApplicationRows(
  actor: ExternalApiActor,
  filters: ExternalApiFilters = {}
) {
  const dashboard = await loadDashboard(actor, {
    userId: filters.userId,
    groupId: filters.groupId,
    role: filters.role,
  });
  const usersById = new Map(dashboard.users.map((user) => [user.id, user]));
  let rows: ExternalApiApplicationRow[];

  try {
    const { listApplicationRecordsFromRelationalStoreByUsers } = await import("@/lib/server/applicationStore");
    const records = await listApplicationRecordsFromRelationalStoreByUsers(
      dashboard.users.map((user) => user.id)
    );

    rows = records
      .map((record) => {
        const user = usersById.get(record.userId);
        return user ? toApplicationRow(record, user) : null;
      })
      .filter((row): row is ExternalApiApplicationRow => Boolean(row));
  } catch {
    rows = dashboard.users.flatMap((user) =>
      user.applications.map((application, index) => ({
        applicationId: index + 1,
        userId: user.id,
        userEmail: user.email,
        userFirstName: user.firstName,
        userLastName: user.lastName,
        userRole: user.role,
        groupIds: user.groupIds,
        groupNames: user.groupNames,
        isFollowUpDue: isDue(
          application.status,
          application.followUpDueAt,
          application.followUpEnabled
        ),
        isInterviewScheduled: isInterviewScheduled(application.interviewAt),
        application,
      }))
    );
  }

  rows = rows.filter((row) => matchesApplicationFilters(row, filters));

  return { dashboard, rows, usersById };
}

export async function requireScopedUser(actor: ExternalApiActor, userId: number) {
  if (actor.role === "admin") return true;
  return canAccessCoachUser(actor, userId);
}

export function normalizeExternalJob(input: Partial<Job> & { id?: string; title?: string }) {
  return {
    id: input.id?.trim() || "",
    title: input.title?.trim() || "",
    company: input.company?.trim() || undefined,
    location: input.location?.trim() || "Non précisé",
    contractType: input.contractType?.trim() || "Non précisé",
    publicationDate: input.publicationDate?.trim() || new Date().toISOString(),
    url: input.url?.trim() || "#",
    description: input.description?.trim() || undefined,
    source: input.source ?? "forem",
    pdfUrl: input.pdfUrl?.trim() || undefined,
  } satisfies Job;
}

export async function persistApplicationRecord(record: { userId: number; position: number }, application: JobApplication) {
  if (!db) throw new Error("Database unavailable");
  const client = await db.connect();

  try {
    await client.query("BEGIN");
    await saveApplicationToRelationalStore(client, {
      userId: record.userId,
      position: record.position,
      application,
      sourceType: inferApplicationSourceType(application),
    });
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
