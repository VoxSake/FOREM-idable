import { randomUUID } from "crypto";
import { inferApplicationSourceType } from "@/lib/applications/sourceType";
import {
  listApplicationsFromRelationalStoreByUsers,
  loadApplicationFromRelationalStore,
  saveApplicationToRelationalStore,
} from "@/lib/server/applicationStore";
import {
  normalizeApplicationCoachNotes,
  toCoachNoteAuthor,
} from "@/lib/coachNotes";
import { recordAuditEvent } from "@/lib/server/auditLog";
import { getCurrentUser } from "@/lib/server/auth";
import { db, ensureDatabase } from "@/lib/server/db";
import {
  assertCanAccessCoachUser,
  getManagedGroupIdsForCoach,
  markCoachAction,
  type CoachCapableUser,
} from "@/lib/server/coachGroups";
import { ApplicationPatchInput, normalizeApplicationPatch } from "@/lib/server/requestSchemas";
import { logServerEvent } from "@/lib/server/observability";
import {
  createTrackedApplicationForUser,
  deleteApplicationForUser,
  updateApplicationForUser,
} from "@/lib/server/applications";
import { buildCoachApplicationSummary } from "@/features/coach/applicationSummary";
import { CoachNoteAuthor, CoachSharedNote, JobApplication } from "@/types/application";
import { AuthUser, UserRole } from "@/types/auth";
import {
  CoachDashboardData,
  CoachGroupMember,
  CoachGroupSummary,
  CoachUserSummary,
} from "@/types/coach";
import { normalizeCoachImportedStatus } from "@/features/coach/importUtils";
import { Job } from "@/types/job";
interface CoachDashboardFilters {
  userId?: number | null;
  groupId?: number | null;
  role?: UserRole | null;
  search?: string | null;
}

function toNumericId(value: number | string | null | undefined) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function canCoach(role: UserRole) {
  return role === "coach" || role === "admin";
}

function matchesDashboardSearch(
  haystack: Array<string | null | undefined>,
  search?: string | null
) {
  const normalized = search?.trim().toLowerCase();
  if (!normalized) return true;

  return haystack
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(normalized);
}

function toGroupParticipant(input: {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  last_seen_at?: string | null;
}) {
  return {
    id: input.id,
    email: input.email,
    firstName: input.first_name,
    lastName: input.last_name,
    role: input.role,
    lastSeenAt: input.last_seen_at ?? null,
  };
}

export async function requireCoachAccess(): Promise<CoachCapableUser | null> {
  const user = await getCurrentUser();
  if (!user || !canCoach(user.role)) {
    return null;
  }

  return user as CoachCapableUser;
}

export async function requireAdminAccess(): Promise<(AuthUser & { role: "admin" }) | null> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return null;
  }

  return user as AuthUser & { role: "admin" };
}

export async function getCoachDashboard(
  viewer: CoachCapableUser,
  filters: CoachDashboardFilters = {}
): Promise<CoachDashboardData> {
  await ensureDatabase();
  if (!db) throw new Error("Database unavailable");

  const [usersResult, groupsResult, membersResult, coachesResult, managedGroupIds] = await Promise.all([
    db.query<{
      id: number;
      email: string;
      first_name: string;
      last_name: string;
      role: UserRole;
      last_seen_at: string | null;
      last_coach_action_at: string | null;
    }>(
      `SELECT id,
              email,
              first_name,
              last_name,
              role,
              last_seen_at,
              last_coach_action_at
       FROM users
       ORDER BY last_name ASC, first_name ASC, email ASC`
    ),
    db.query<{
      id: number;
      name: string;
      created_at: string;
      created_by: number;
      created_by_email: string;
      created_by_first_name: string;
      created_by_last_name: string;
      manager_coach_user_id: number | null;
    }>(
      `SELECT coach_groups.id,
              coach_groups.name,
              coach_groups.created_at,
              coach_groups.created_by,
              coach_groups.manager_coach_user_id,
              users.email AS created_by_email,
              users.first_name AS created_by_first_name,
              users.last_name AS created_by_last_name
       FROM coach_groups
       INNER JOIN users ON users.id = coach_groups.created_by
       ORDER BY coach_groups.name ASC, coach_groups.created_at DESC`
    ),
    db.query<{
      group_id: number;
      user_id: number;
      email: string;
      first_name: string;
      last_name: string;
      role: UserRole;
    }>(
      `SELECT coach_group_members.group_id,
              users.id AS user_id,
              users.email,
              users.first_name,
              users.last_name,
              users.role
       FROM coach_group_members
       INNER JOIN users ON users.id = coach_group_members.user_id
       ORDER BY users.last_name ASC, users.first_name ASC, users.email ASC`
    ),
    db.query<{
      group_id: number;
      user_id: number;
      email: string;
      first_name: string;
      last_name: string;
      role: UserRole;
      last_seen_at: string | null;
    }>(
      `SELECT coach_group_coaches.group_id,
              users.id AS user_id,
              users.email,
              users.first_name,
              users.last_name,
              users.role,
              users.last_seen_at
       FROM coach_group_coaches
       INNER JOIN users ON users.id = coach_group_coaches.user_id
       ORDER BY users.last_name ASC, users.first_name ASC, users.email ASC`
    ),
    viewer.role === "admin" ? Promise.resolve([]) : getManagedGroupIdsForCoach(viewer.id),
  ]);

  const visibleGroupIds =
    viewer.role === "admin"
      ? new Set(
          groupsResult.rows
            .map((row) => toNumericId(row.id))
            .filter((groupId): groupId is number => groupId !== null)
        )
      : new Set(managedGroupIds);

  const groupsById = new Map<number, CoachGroupSummary>();
  for (const row of groupsResult.rows) {
    const groupId = toNumericId(row.id);
    const createdById = toNumericId(row.created_by);
    const managerCoachId = toNumericId(row.manager_coach_user_id);
    if (groupId === null || createdById === null || !visibleGroupIds.has(groupId)) {
      continue;
    }

    groupsById.set(groupId, {
      id: groupId,
      name: row.name,
      createdAt: row.created_at,
      createdBy: {
        id: createdById,
        email: row.created_by_email,
        firstName: row.created_by_first_name,
        lastName: row.created_by_last_name,
      },
      managerCoachId,
      members: [],
      coaches: [],
    });
  }

  const groupIdsByUser = new Map<number, number[]>();
  const groupNamesByUser = new Map<number, string[]>();
  for (const row of coachesResult.rows) {
    const groupId = toNumericId(row.group_id);
    const userId = toNumericId(row.user_id);
    if (groupId === null || userId === null) continue;

    const group = groupsById.get(groupId);
    if (!group) continue;

    group.coaches.push(
      toGroupParticipant({
        id: userId,
        email: row.email,
        first_name: row.first_name,
        last_name: row.last_name,
        role: row.role,
        last_seen_at: row.last_seen_at,
      })
    );
  }

  for (const row of membersResult.rows) {
    const groupId = toNumericId(row.group_id);
    const userId = toNumericId(row.user_id);
    if (groupId === null || userId === null) continue;

    const group = groupsById.get(groupId);
    if (!group) continue;

    group.members.push(
      toGroupParticipant({
        id: userId,
        email: row.email,
        first_name: row.first_name,
        last_name: row.last_name,
        role: row.role,
      })
    );

    groupIdsByUser.set(userId, [...(groupIdsByUser.get(userId) ?? []), groupId]);
    groupNamesByUser.set(userId, [...(groupNamesByUser.get(userId) ?? []), group.name]);
  }

  const scopedUserRows = usersResult.rows.filter((row) => {
    const userId = toNumericId(row.id);
    if (userId === null) return false;

    const groupIds = groupIdsByUser.get(userId) ?? [];
    const groupNames = groupNamesByUser.get(userId) ?? [];

    if (viewer.role !== "admin" && groupIds.length === 0) {
      return false;
    }

    if (filters.userId && userId !== filters.userId) return false;
    if (filters.groupId && !groupIds.includes(filters.groupId)) return false;
    if (filters.role && row.role !== filters.role) return false;

    return matchesDashboardSearch(
      [row.first_name, row.last_name, `${row.first_name} ${row.last_name}`.trim(), row.email, ...groupNames],
      filters.search
    );
  });

  const scopedUserIds = scopedUserRows
    .map((row) => toNumericId(row.id))
    .filter((userId): userId is number => userId !== null);
  const applicationsByUser = await listApplicationsFromRelationalStoreByUsers(scopedUserIds);

  const users: CoachUserSummary[] = scopedUserRows.map((row) => {
    const userId = toNumericId(row.id);
    if (userId === null) {
      throw new Error("Invalid user id in coach dashboard");
    }
    const applications = applicationsByUser.get(userId) ?? [];

    return {
      id: userId,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      role: row.role,
      groupIds: groupIdsByUser.get(userId) ?? [],
      groupNames: groupNamesByUser.get(userId) ?? [],
      ...buildCoachApplicationSummary(applications),
      lastSeenAt: row.last_seen_at,
      lastCoachActionAt: row.last_coach_action_at,
      applications,
    };
  });

  return {
    viewer,
    users,
    groups: Array.from(groupsById.values()),
    availableCoaches: usersResult.rows
      .filter((row) => row.role === "coach")
      .map((row) => {
        const coachId = toNumericId(row.id);
        if (coachId === null) return null;
        return toGroupParticipant({
          id: coachId,
          email: row.email,
          first_name: row.first_name,
          last_name: row.last_name,
          role: row.role,
        });
      })
      .filter((row): row is CoachGroupMember => Boolean(row)),
  };
}

export async function setUserRole(userId: number, role: UserRole, actorId?: number) {
  await ensureDatabase();
  if (!db) throw new Error("Database unavailable");

  const previousResult = await db.query<{ role: UserRole }>(
    `SELECT role
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [userId]
  );
  const previousRole = previousResult.rows[0]?.role ?? null;
  if (!previousRole) {
    throw new Error("User not found");
  }

  await db.query(
    `UPDATE users
     SET role = $2
     WHERE id = $1`,
    [userId, role]
  );

  if (role !== "coach" && role !== "admin") {
    await db.query(
      `DELETE FROM coach_group_coaches
       WHERE user_id = $1`,
      [userId]
    );
    await db.query(
      `UPDATE coach_groups
       SET manager_coach_user_id = NULL
       WHERE manager_coach_user_id = $1`,
      [userId]
    );
  }

  if (actorId) {
    await markCoachAction(actorId);
    await recordAuditEvent({
      actorUserId: actorId,
      action: "admin_role_changed",
      targetUserId: userId,
      payload: { fromRole: previousRole, toRole: role },
    });
    logServerEvent({
      category: "admin",
      action: "role_changed",
      meta: { actorUserId: actorId, targetUserId: userId, fromRole: previousRole, toRole: role },
    });
  }
}

function withContributor<T extends { contributors: CoachNoteAuthor[] }>(
  note: T,
  actor: CoachNoteAuthor
) {
  const alreadyContributor = note.contributors.some((entry) => entry.id === actor.id);
  return {
    ...note,
    contributors: alreadyContributor ? note.contributors : [...note.contributors, actor],
  };
}

export async function updateCoachApplicationNotes(input: {
  actor: CoachCapableUser;
  userId: number;
  jobId: string;
  privateNoteContent?: string;
  sharedNoteId?: string;
  sharedNoteContent?: string;
  createSharedNote?: boolean;
  deleteSharedNote?: boolean;
}) {
  await ensureDatabase();
  if (!db) throw new Error("Database unavailable");
  await assertCanAccessCoachUser(input.actor, input.userId);
  const actor = toCoachNoteAuthor(input.actor);
  const relational = await loadApplicationFromRelationalStore(input.userId, input.jobId);
  const existing = relational;
  if (!existing) {
    throw new Error("Application not found");
  }

  const normalizedExisting = normalizeApplicationCoachNotes(existing);
  const now = new Date().toISOString();
  const nextApplication: JobApplication = {
    ...normalizedExisting,
    updatedAt: now,
  };

  if (typeof input.privateNoteContent === "string") {
    const trimmedPrivate = input.privateNoteContent.trim();

    nextApplication.privateCoachNote = trimmedPrivate
      ? withContributor(
          {
            content: trimmedPrivate,
            createdAt: normalizedExisting.privateCoachNote?.createdAt ?? now,
            updatedAt: now,
            createdBy: normalizedExisting.privateCoachNote?.createdBy ?? actor,
            contributors: normalizedExisting.privateCoachNote?.contributors ?? [actor],
          },
          actor
        )
      : undefined;
  }

  if (input.createSharedNote) {
    const trimmedShared = input.sharedNoteContent?.trim() ?? "";
    if (!trimmedShared) {
      throw new Error("Shared note content required");
    }

    const sharedNote: CoachSharedNote = {
      id: randomUUID(),
      content: trimmedShared,
      createdAt: now,
      updatedAt: now,
      createdBy: actor,
      contributors: [actor],
    };

    nextApplication.sharedCoachNotes = [
      ...(normalizedExisting.sharedCoachNotes ?? []),
      sharedNote,
    ];
  }

  if (input.sharedNoteId && typeof input.sharedNoteContent === "string" && !input.createSharedNote) {
    const trimmedShared = input.sharedNoteContent.trim();
    nextApplication.sharedCoachNotes = (normalizedExisting.sharedCoachNotes ?? []).map((note) =>
      note.id === input.sharedNoteId
        ? withContributor(
            {
              ...note,
              content: trimmedShared,
              updatedAt: now,
            },
            actor
          )
        : note
    ).filter((note) => note.content.trim());
  }

  if (input.sharedNoteId && input.deleteSharedNote) {
    nextApplication.sharedCoachNotes = (normalizedExisting.sharedCoachNotes ?? []).filter(
      (note) => note.id !== input.sharedNoteId
    );
  }
  const positionResult = await db.query<{ position: number }>(
    `SELECT position
     FROM applications
     WHERE user_id = $1 AND job_id = $2
     LIMIT 1`,
    [input.userId, input.jobId]
  );
  const position = positionResult.rows[0]?.position ?? 0;
  const client = await db.connect();

  try {
    await client.query("BEGIN");
    await saveApplicationToRelationalStore(client, {
      userId: input.userId,
      position,
      application: nextApplication,
      sourceType: inferApplicationSourceType(nextApplication),
    });
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  await markCoachAction(input.actor.id);

  return normalizeApplicationCoachNotes(nextApplication);
}

export interface CoachImportedApplicationInput {
  company: string;
  contractType?: string;
  title: string;
  location?: string;
  appliedAt?: string;
  status?: JobApplication["status"];
  notes?: string;
}

export type CoachImportDateFormat = "dmy" | "mdy";

function normalizeImportedDate(value?: string, dateFormat: CoachImportDateFormat = "dmy") {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }

  const delimitedMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2}|\d{4})$/);
  if (delimitedMatch) {
    const [, first, second, year] = delimitedMatch;
    const day = dateFormat === "mdy" ? second : first;
    const month = dateFormat === "mdy" ? first : second;
    const normalizedYear = year.length === 2 ? `20${year}` : year;
    const isoCandidate = `${normalizedYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    const parsed = new Date(`${isoCandidate}T00:00:00.000Z`);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function buildImportedManualJob(
  input: CoachImportedApplicationInput,
  dateFormat: CoachImportDateFormat
): Job {
  const appliedAt = normalizeImportedDate(input.appliedAt, dateFormat) ?? new Date().toISOString();
  const fingerprint = `${input.company}|${input.title}|${appliedAt}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return {
    id: `manual-import-${fingerprint || Math.random().toString(36).slice(2, 8)}`,
    title: input.title.trim(),
    company: input.company.trim(),
    location: input.location?.trim() || "Non précisé",
    contractType: input.contractType?.trim() || "Non précisé",
    publicationDate: appliedAt,
    url: "#",
    source: "forem",
  };
}

export async function importCoachApplicationsForUser(input: {
  actor: CoachCapableUser;
  userId: number;
  rows: CoachImportedApplicationInput[];
  dateFormat?: CoachImportDateFormat;
}) {
  await ensureDatabase();
  if (!db) throw new Error("Database unavailable");
  await assertCanAccessCoachUser(input.actor, input.userId);

  const importedApplications: JobApplication[] = [];
  let createdCount = 0;
  let updatedCount = 0;
  let ignoredCount = 0;
  const seenJobIds = new Set<string>();

  const dateFormat = input.dateFormat ?? "dmy";

  for (const row of input.rows) {
    if (!row.company.trim() || !row.title.trim()) {
      ignoredCount += 1;
      continue;
    }

    const job = buildImportedManualJob(row, dateFormat);
    if (seenJobIds.has(job.id)) {
      ignoredCount += 1;
      continue;
    }
    seenJobIds.add(job.id);

    const existed = Boolean(await loadApplicationFromRelationalStore(input.userId, job.id));

    const application = await createTrackedApplicationForUser({
      userId: input.userId,
      job,
      appliedAt: normalizeImportedDate(row.appliedAt, dateFormat),
      status: normalizeCoachImportedStatus(row.status) ?? "in_progress",
      notes: row.notes?.trim(),
    });

    importedApplications.push(application);
    if (existed) {
      updatedCount += 1;
    } else {
      createdCount += 1;
    }
  }

  await markCoachAction(input.actor.id);
  await recordAuditEvent({
    actorUserId: input.actor.id,
    action: "coach_csv_import_completed",
    targetUserId: input.userId,
    payload: {
      createdCount,
      updatedCount,
      ignoredCount,
      importedCount: importedApplications.length,
    },
  });
  logServerEvent({
    category: "coach",
    action: "csv_import_completed",
    meta: {
      actorUserId: input.actor.id,
      targetUserId: input.userId,
      createdCount,
      updatedCount,
      ignoredCount,
      importedCount: importedApplications.length,
    },
  });

  return {
    applications: importedApplications,
    createdCount,
    updatedCount,
    ignoredCount,
  };
}

export async function updateCoachManagedApplication(input: {
  actor: CoachCapableUser;
  userId: number;
  jobId: string;
  patch: ApplicationPatchInput;
}) {
  await assertCanAccessCoachUser(input.actor, input.userId);

  const application = await updateApplicationForUser({
    userId: input.userId,
    jobId: input.jobId,
    patch: normalizeApplicationPatch(input.jobId, input.patch),
  });

  await markCoachAction(input.actor.id);

  return application;
}

export async function deleteCoachManagedApplication(input: {
  actor: CoachCapableUser;
  userId: number;
  jobId: string;
}) {
  await assertCanAccessCoachUser(input.actor, input.userId);
  await deleteApplicationForUser(input.userId, input.jobId);
  await markCoachAction(input.actor.id);
}

export {
  addCoachToGroup,
  addUserToCoachGroup,
  canAccessCoachUser,
  canManageCoachAssignments,
  canManageCoachGroup,
  createCoachGroup,
  deleteCoachGroup,
  markCoachAction,
  removeCoachFromGroup,
  removeUserFromCoachGroup,
  setCoachGroupManager,
} from "@/lib/server/coachGroups";
