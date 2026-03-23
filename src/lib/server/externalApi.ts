import { randomUUID } from "crypto";
import { isAfter } from "date-fns";
import {
  formatCoachAuthorName,
  summarizeCoachContributors,
  toCoachNoteAuthor,
} from "@/lib/coachNotes";
import {
  getRelationalApplicationRecordById,
  getRelationalApplicationRecordByUserAndJob,
  listApplicationRecordsFromRelationalStoreByUsers,
  RelationalApplicationRecord,
  saveApplicationToRelationalStore,
} from "@/lib/server/applicationStore";
import {
  createTrackedApplicationForUser,
  deleteApplicationForUser,
  updateApplicationForUser,
} from "@/lib/server/applications";
import {
  canAccessCoachUser,
  getCoachDashboard,
} from "@/lib/server/coach";
import { db } from "@/lib/server/db";
import { ApplicationPatchInput, normalizeApplicationPatch } from "@/lib/server/requestSchemas";
import {
  ExternalApiActor,
  ExternalApiApplicationDetail,
  ExternalApiApplicationRow,
  ExternalApiApplicationsResponse,
  ExternalApiFilters,
  ExternalApiGroupCoachSummary,
  ExternalApiGroupSummary,
  ExternalApiGroupsResponse,
  ExternalApiMutationResponse,
  ExternalApiStats,
  ExternalApiUserDetail,
  ExternalApiUserSummary,
  ExternalApiUsersResponse,
} from "@/types/externalApi";
import { ApplicationStatus, JobApplication } from "@/types/application";
import { CoachGroupMember, CoachUserSummary } from "@/types/coach";
import { escapeCsvCell } from "@/lib/csv";
import { Job } from "@/types/job";

function matchesSearch(haystack: string[], search?: string) {
  const normalized = search?.trim().toLowerCase();
  if (!normalized) return true;
  return haystack.join(" ").toLowerCase().includes(normalized);
}

function isDue(status: ApplicationStatus, dueAt: string, followUpEnabled?: boolean) {
  const due = new Date(dueAt);
  return (
    (status === "in_progress" || status === "follow_up") &&
    followUpEnabled !== false &&
    !Number.isNaN(due.getTime()) &&
    !isAfter(due, new Date())
  );
}

function buildStats(
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

function normalizeLimit(value: number | undefined, fallback: number) {
  if (!value || !Number.isFinite(value)) return fallback;
  return Math.max(1, Math.min(500, Math.floor(value)));
}

function normalizeOffset(value: number | undefined) {
  if (!value || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function toExternalUserSummary(
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

function toExternalGroupCoachSummary(
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

async function loadDashboard(
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

function formatNoteContributors(application: JobApplication) {
  return (application.sharedCoachNotes ?? [])
    .map((note) => summarizeCoachContributors(note.contributors))
    .join(" | ");
}

function formatSharedNotes(application: JobApplication) {
  return (application.sharedCoachNotes ?? [])
    .map((note) => `${formatCoachAuthorName(note.createdBy)}: ${note.content}`)
    .join(" | ");
}

function toApplicationRow(
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
    application: record.application,
  };
}

function toApplicationDetail(
  record: RelationalApplicationRecord,
  user: CoachUserSummary
): ExternalApiApplicationDetail {
  return toApplicationRow(record, user);
}

function matchesApplicationFilters(row: ExternalApiApplicationRow, filters: ExternalApiFilters) {
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

function sanitizeApplicationForList(
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

async function getScopedApplicationRows(
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
        application,
      }))
    );
  }

  rows = rows.filter((row) => matchesApplicationFilters(row, filters));

  return { dashboard, rows, usersById };
}

async function requireScopedUser(actor: ExternalApiActor, userId: number) {
  if (actor.role === "admin") return true;
  return canAccessCoachUser(actor, userId);
}

function normalizeExternalJob(input: Partial<Job> & { id?: string; title?: string }) {
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

async function persistApplicationRecord(record: RelationalApplicationRecord, application: JobApplication) {
  if (!db) throw new Error("Database unavailable");
  const client = await db.connect();

  try {
    await client.query("BEGIN");
    await saveApplicationToRelationalStore(client, {
      userId: record.userId,
      position: record.position,
      application,
      sourceType:
        application.job.url === "#" || application.job.id.startsWith("manual-")
          ? "manual"
          : "tracked",
    });
    await client.query(
      `INSERT INTO user_applications (user_id, job_id, position, application)
       VALUES ($1, $2, $3, $4::jsonb)
       ON CONFLICT (user_id, job_id)
       DO UPDATE SET
         position = EXCLUDED.position,
         application = EXCLUDED.application`,
      [record.userId, record.jobId, record.position, JSON.stringify(application)]
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getExternalUsers(
  actor: ExternalApiActor,
  filters: ExternalApiFilters = {}
): Promise<ExternalApiUsersResponse> {
  const dashboard = await loadDashboard(actor, {
    userId: filters.userId,
    groupId: filters.groupId,
    role: filters.role,
    search: filters.search,
  });
  const offset = normalizeOffset(filters.offset);
  const limit = normalizeLimit(filters.limit, 200);

  const serializedUsers = dashboard.users
    .slice(offset, offset + limit)
    .map((entry) => toExternalUserSummary(entry, Boolean(filters.includeApplications)));

  return {
    actor,
    stats: buildStats(dashboard.users),
    users: serializedUsers,
  };
}

export async function getExternalUserDetail(
  actor: ExternalApiActor,
  userId: number
): Promise<ExternalApiUserDetail | null> {
  const dashboard = await loadDashboard(actor, { userId });
  const user = dashboard.users.find((entry) => entry.id === userId);
  if (!user) return null;

  return toExternalUserSummary(user, true);
}

export async function getExternalGroups(
  actor: ExternalApiActor,
  filters: ExternalApiFilters = {}
): Promise<ExternalApiGroupsResponse> {
  const dashboard = await loadDashboard(actor, {
    groupId: filters.groupId,
  });
  const offset = normalizeOffset(filters.offset);
  const limit = normalizeLimit(filters.limit, 200);
  const usersById = new Map(dashboard.users.map((entry) => [entry.id, entry]));

  let groups: ExternalApiGroupSummary[] = dashboard.groups
    .filter((group) =>
      matchesSearch(
        [
          group.name,
          group.createdBy.email,
          ...group.coaches.flatMap((coach) => [
            coach.email,
            coach.firstName,
            coach.lastName,
            `${coach.firstName} ${coach.lastName}`.trim(),
          ]),
        ],
        filters.search
      )
    )
    .map((group) => {
      const members = group.members
        .map((member) => usersById.get(member.id))
        .filter((entry): entry is CoachUserSummary => Boolean(entry));
      const coaches = group.coaches.map((coach) =>
        toExternalGroupCoachSummary(coach, group.managerCoachId)
      );
      const manager = coaches.find((coach) => coach.isManager) ?? null;

      return {
        id: group.id,
        name: group.name,
        createdAt: group.createdAt,
        createdBy: {
          id: group.createdBy.id,
          email: group.createdBy.email,
        },
        managerCoachId: group.managerCoachId,
        manager,
        coachCount: coaches.length,
        coaches,
        memberCount: members.length,
        totalApplications: members.reduce((sum, entry) => sum + entry.applicationCount, 0),
        totalInterviews: members.reduce((sum, entry) => sum + entry.interviewCount, 0),
        members: filters.includeApplications
          ? members.map((entry) => toExternalUserSummary(entry, true))
          : undefined,
      };
    });

  if (filters.groupId) {
    groups = groups.filter((group) => group.id === filters.groupId);
  }

  return {
    actor,
    stats: buildStats(dashboard.users),
    groups: groups.slice(offset, offset + limit),
  };
}

export async function getExternalGroupDetail(actor: ExternalApiActor, groupId: number) {
  const response = await getExternalGroups(actor, {
    groupId,
    includeApplications: true,
    limit: 1,
  });

  return response.groups[0] ?? null;
}

export async function getExternalApplications(
  actor: ExternalApiActor,
  filters: ExternalApiFilters = {}
): Promise<ExternalApiApplicationsResponse> {
  const { dashboard, rows } = await getScopedApplicationRows(actor, filters);
  const offset = normalizeOffset(filters.offset);
  const limit = normalizeLimit(filters.limit, 500);

  return {
    actor,
    stats: buildStats(dashboard.users),
    applications: rows
      .slice(offset, offset + limit)
      .map((row) => sanitizeApplicationForList(row, filters)),
  };
}

export async function getExternalApplicationDetail(
  actor: ExternalApiActor,
  applicationId: number
): Promise<ExternalApiApplicationDetail | null> {
  const record = await getRelationalApplicationRecordById(applicationId);
  if (!record) return null;

  const dashboard = await loadDashboard(actor, { userId: record.userId });
  const user = dashboard.users.find((entry) => entry.id === record.userId);
  if (!user) return null;

  return toApplicationDetail(record, user);
}

export async function upsertExternalApplication(
  actor: ExternalApiActor,
  input: {
    match: { userId: number; jobId: string };
    data: Partial<
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
      >
    > & { job: Partial<Job> & { title: string } };
  }
): Promise<ExternalApiMutationResponse> {
  const allowed = await requireScopedUser(actor, input.match.userId);
  if (!allowed) throw new Error("Forbidden");

  const existing = await getRelationalApplicationRecordByUserAndJob(
    input.match.userId,
    input.match.jobId
  );

  if (!existing) {
    await createTrackedApplicationForUser({
      userId: input.match.userId,
      job: normalizeExternalJob({
        ...input.data.job,
        id: input.match.jobId,
      }),
      appliedAt: input.data.appliedAt,
      status: input.data.status,
      notes: input.data.notes ?? undefined,
      proofs: input.data.proofs ?? undefined,
      interviewAt: input.data.interviewAt ?? undefined,
      interviewDetails: input.data.interviewDetails ?? undefined,
    });

    if (
      input.data.followUpDueAt ||
      input.data.followUpEnabled !== undefined ||
      input.data.lastFollowUpAt
    ) {
      await updateApplicationForUser({
        userId: input.match.userId,
        jobId: input.match.jobId,
        patch: {
          followUpDueAt: input.data.followUpDueAt,
          followUpEnabled: input.data.followUpEnabled,
          lastFollowUpAt: input.data.lastFollowUpAt,
        },
      });
    }

    const detail = await getExternalApplicationDetail(
      actor,
      (await getRelationalApplicationRecordByUserAndJob(input.match.userId, input.match.jobId))
        ?.applicationId ?? 0
    );
    if (!detail) {
      throw new Error("Application not found");
    }

    return {
      actor,
      created: true,
      application: detail,
    };
  }

  await updateApplicationForUser({
    userId: input.match.userId,
    jobId: input.match.jobId,
    patch: {
      status: input.data.status,
      notes: input.data.notes,
      proofs: input.data.proofs,
      interviewAt: input.data.interviewAt,
      interviewDetails: input.data.interviewDetails,
      lastFollowUpAt: input.data.lastFollowUpAt,
      followUpDueAt: input.data.followUpDueAt,
      followUpEnabled: input.data.followUpEnabled,
      appliedAt: input.data.appliedAt,
      job: input.data.job
        ? {
            ...normalizeExternalJob({
              ...input.data.job,
              id: input.match.jobId,
            }),
          }
        : undefined,
    },
  });

  const detail = await getExternalApplicationDetail(actor, existing.applicationId);
  if (!detail) {
    throw new Error("Application not found");
  }

  return {
    actor,
    created: false,
    application: detail,
  };
}

export async function patchExternalApplication(
  actor: ExternalApiActor,
  applicationId: number,
  patch: ApplicationPatchInput
): Promise<ExternalApiMutationResponse> {
  const record = await getRelationalApplicationRecordById(applicationId);
  if (!record) throw new Error("Application not found");

  const allowed = await requireScopedUser(actor, record.userId);
  if (!allowed) throw new Error("Forbidden");

  await updateApplicationForUser({
    userId: record.userId,
    jobId: record.jobId,
    patch: normalizeApplicationPatch(record.jobId, patch),
  });

  const detail = await getExternalApplicationDetail(actor, applicationId);
  if (!detail) throw new Error("Application not found");

  return { actor, application: detail };
}

export async function deleteExternalApplication(
  actor: ExternalApiActor,
  applicationId: number
) {
  const record = await getRelationalApplicationRecordById(applicationId);
  if (!record) throw new Error("Application not found");

  const allowed = await requireScopedUser(actor, record.userId);
  if (!allowed) throw new Error("Forbidden");

  await deleteApplicationForUser(record.userId, record.jobId);
}

export async function saveExternalPrivateNote(
  actor: ExternalApiActor,
  applicationId: number,
  content: string
): Promise<ExternalApiMutationResponse> {
  const record = await getRelationalApplicationRecordById(applicationId);
  if (!record) throw new Error("Application not found");

  const allowed = await requireScopedUser(actor, record.userId);
  if (!allowed) throw new Error("Forbidden");
  const author = toCoachNoteAuthor(actor);
  const now = new Date().toISOString();
  const nextApplication: JobApplication = {
    ...record.application,
    privateCoachNote: content.trim()
      ? {
          content: content.trim(),
          createdAt: record.application.privateCoachNote?.createdAt ?? now,
          updatedAt: now,
          createdBy: record.application.privateCoachNote?.createdBy ?? author,
          contributors: record.application.privateCoachNote?.contributors?.some(
            (entry) => entry.id === author.id
          )
            ? (record.application.privateCoachNote?.contributors ?? [])
            : [...(record.application.privateCoachNote?.contributors ?? []), author],
        }
      : undefined,
    updatedAt: now,
  };
  await persistApplicationRecord(record, nextApplication);

  const detail = await getExternalApplicationDetail(actor, applicationId);
  if (!detail) throw new Error("Application not found");

  return { actor, application: detail };
}

export async function createExternalSharedNote(
  actor: ExternalApiActor,
  applicationId: number,
  content: string
): Promise<ExternalApiMutationResponse> {
  const record = await getRelationalApplicationRecordById(applicationId);
  if (!record) throw new Error("Application not found");

  const allowed = await requireScopedUser(actor, record.userId);
  if (!allowed) throw new Error("Forbidden");
  if (!content.trim()) throw new Error("Shared note content required");
  const author = toCoachNoteAuthor(actor);
  const now = new Date().toISOString();
  const nextApplication: JobApplication = {
    ...record.application,
    sharedCoachNotes: [
      ...(record.application.sharedCoachNotes ?? []),
      {
        id: randomUUID(),
        content: content.trim(),
        createdAt: now,
        updatedAt: now,
        createdBy: author,
        contributors: [author],
      },
    ],
    updatedAt: now,
  };
  await persistApplicationRecord(record, nextApplication);

  const detail = await getExternalApplicationDetail(actor, applicationId);
  if (!detail) throw new Error("Application not found");

  return { actor, application: detail };
}

export async function updateExternalSharedNote(
  actor: ExternalApiActor,
  applicationId: number,
  noteId: string,
  content: string
): Promise<ExternalApiMutationResponse> {
  const record = await getRelationalApplicationRecordById(applicationId);
  if (!record) throw new Error("Application not found");

  const allowed = await requireScopedUser(actor, record.userId);
  if (!allowed) throw new Error("Forbidden");
  const author = toCoachNoteAuthor(actor);
  const now = new Date().toISOString();
  const nextApplication: JobApplication = {
    ...record.application,
    sharedCoachNotes: (record.application.sharedCoachNotes ?? [])
      .map((note) =>
        note.id === noteId
          ? {
              ...note,
              content: content.trim(),
              updatedAt: now,
              contributors: note.contributors.some((entry) => entry.id === author.id)
                ? note.contributors
                : [...note.contributors, author],
            }
          : note
      )
      .filter((note) => note.content.trim()),
    updatedAt: now,
  };
  await persistApplicationRecord(record, nextApplication);

  const detail = await getExternalApplicationDetail(actor, applicationId);
  if (!detail) throw new Error("Application not found");

  return { actor, application: detail };
}

export async function deleteExternalSharedNote(
  actor: ExternalApiActor,
  applicationId: number,
  noteId: string
): Promise<ExternalApiMutationResponse> {
  const record = await getRelationalApplicationRecordById(applicationId);
  if (!record) throw new Error("Application not found");

  const allowed = await requireScopedUser(actor, record.userId);
  if (!allowed) throw new Error("Forbidden");
  const nextApplication: JobApplication = {
    ...record.application,
    sharedCoachNotes: (record.application.sharedCoachNotes ?? []).filter((note) => note.id !== noteId),
    updatedAt: new Date().toISOString(),
  };
  await persistApplicationRecord(record, nextApplication);

  const detail = await getExternalApplicationDetail(actor, applicationId);
  if (!detail) throw new Error("Application not found");

  return { actor, application: detail };
}

export function buildUsersCsv(users: ExternalApiUsersResponse["users"]) {
  const headers = [
    "ID",
    "Prénom",
    "Nom",
    "Email",
    "Rôle",
    "Groupes",
    "Candidatures",
    "Entretiens",
    "Relances dues",
    "Acceptées",
    "Refusées",
    "En cours",
    "Dernière activité",
  ];

  const rows = users.map((user) => [
    String(user.id),
    user.firstName,
    user.lastName,
    user.email,
    user.role,
    user.groupNames.join(" | "),
    String(user.applicationCount),
    String(user.interviewCount),
    String(user.dueCount),
    String(user.acceptedCount),
    String(user.rejectedCount),
    String(user.inProgressCount),
    user.latestActivityAt || "",
  ]);

  return toCsv(headers, rows);
}

export function buildGroupsCsv(groups: ExternalApiGroupsResponse["groups"]) {
  const headers = [
    "ID groupe",
    "Nom groupe",
    "Créé le",
    "Créé par",
    "Manager",
    "Nombre de coachs",
    "Coachs attribués",
    "Membres",
    "Candidatures",
    "Entretiens",
  ];

  const rows = groups.map((group) => [
    String(group.id),
    group.name,
    group.createdAt,
    group.createdBy.email,
    group.manager?.fullName || "",
    String(group.coachCount),
    group.coaches.map((coach) => coach.fullName).join(" | "),
    String(group.memberCount),
    String(group.totalApplications),
    String(group.totalInterviews),
  ]);

  return toCsv(headers, rows);
}

export function buildApplicationsCsv(applications: ExternalApiApplicationsResponse["applications"]) {
  const headers = [
    "Application ID",
    "User ID",
    "Job ID",
    "Prénom",
    "Nom",
    "Email",
    "Rôle",
    "Groupes",
    "Entreprise",
    "Intitulé",
    "Type",
    "Lieu",
    "Date envoyée",
    "Date relance",
    "Dernière relance",
    "Date entretien",
    "Détails entretien",
    "Statut",
    "Notes bénéficiaire",
    "Preuves",
    "Note privée coach",
    "Contributeurs note privée",
    "Nombre notes partagées",
    "Notes coach partagées",
    "Contributeurs notes partagées",
    "Lien",
    "PDF",
    "Mis à jour le",
  ];

  const rows = applications.map((row) => [
    String(row.applicationId),
    String(row.userId),
    row.application.job.id,
    row.userFirstName,
    row.userLastName,
    row.userEmail,
    row.userRole,
    row.groupNames.join(" | "),
    row.application.job.company || "",
    row.application.job.title,
    row.application.job.contractType,
    row.application.job.location,
    row.application.appliedAt,
    row.application.followUpDueAt,
    row.application.lastFollowUpAt || "",
    row.application.interviewAt || "",
    row.application.interviewDetails || "",
    row.application.status,
    row.application.notes || "",
    row.application.proofs || "",
    row.application.privateCoachNote?.content || "",
    row.application.privateCoachNote
      ? summarizeCoachContributors(row.application.privateCoachNote.contributors)
      : "",
    String(row.application.sharedCoachNotes?.length ?? 0),
    formatSharedNotes(row.application),
    formatNoteContributors(row.application),
    row.application.job.url || "",
    row.application.job.pdfUrl || "",
    row.application.updatedAt,
  ]);

  return toCsv(headers, rows);
}

function toCsv(headers: string[], rows: string[][]) {
  return [headers, ...rows]
    .map((row) => row.map((cell) => escapeCsvCell(cell ?? "")).join(","))
    .join("\n");
}
