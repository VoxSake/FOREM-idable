import { randomUUID } from "crypto";
import {
  parseStoredJobApplication,
  safeParseStoredJobApplication,
} from "@/lib/server/applicationSchemas";
import {
  normalizeApplicationCoachNotes,
  toCoachNoteAuthor,
} from "@/lib/coachNotes";
import { recordAuditEvent } from "@/lib/server/auditLog";
import { getCurrentUser } from "@/lib/server/auth";
import { db, ensureDatabase } from "@/lib/server/db";
import { logServerEvent } from "@/lib/server/observability";
import {
  createTrackedApplicationForUser,
  deleteApplicationForUser,
  updateApplicationForUser,
} from "@/lib/server/applications";
import { buildCoachApplicationSummary } from "@/features/coach/applicationSummary";
import { CoachNoteAuthor, CoachSharedNote, JobApplication } from "@/types/application";
import { AuthUser, UserRole } from "@/types/auth";
import { CoachDashboardData, CoachGroupSummary, CoachUserSummary } from "@/types/coach";
import { Job } from "@/types/job";

type CoachCapableUser = AuthUser & { role: "coach" | "admin" };
interface CoachDashboardFilters {
  userId?: number | null;
  groupId?: number | null;
  role?: UserRole | null;
  search?: string | null;
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

async function getManagedGroupIdsForCoach(userId: number) {
  await ensureDatabase();
  if (!db) throw new Error("Database unavailable");

  const result = await db.query<{ group_id: number }>(
    `SELECT group_id
     FROM coach_group_coaches
     WHERE user_id = $1`,
    [userId]
  );

  return result.rows.map((row) => row.group_id);
}

export async function canManageCoachGroup(actor: CoachCapableUser, groupId: number) {
  if (actor.role === "admin") {
    return true;
  }

  await ensureDatabase();
  if (!db) throw new Error("Database unavailable");

  const result = await db.query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1
       FROM coach_group_coaches
       WHERE group_id = $1
         AND user_id = $2
     ) AS exists`,
    [groupId, actor.id]
  );

  return Boolean(result.rows[0]?.exists);
}

export async function canManageCoachAssignments(actor: CoachCapableUser, groupId: number) {
  if (actor.role === "admin") {
    return true;
  }

  await ensureDatabase();
  if (!db) throw new Error("Database unavailable");

  const result = await db.query<{ manager_coach_user_id: number | null }>(
    `SELECT manager_coach_user_id
     FROM coach_groups
     WHERE id = $1
     LIMIT 1`,
    [groupId]
  );

  return result.rows[0]?.manager_coach_user_id === actor.id;
}

export async function canRemoveCoachAssignmentFromGroup(
  actor: CoachCapableUser,
  groupId: number
) {
  return canManageCoachAssignments(actor, groupId);
}

async function assertCanManageCoachGroup(actor: CoachCapableUser, groupId: number) {
  const allowed = await canManageCoachGroup(actor, groupId);
  if (!allowed) {
    throw new Error("Forbidden");
  }
}

export async function canAccessCoachUser(actor: CoachCapableUser, userId: number) {
  if (actor.role === "admin") {
    return true;
  }

  await ensureDatabase();
  if (!db) throw new Error("Database unavailable");

  const result = await db.query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1
       FROM coach_group_members
       INNER JOIN coach_group_coaches
         ON coach_group_coaches.group_id = coach_group_members.group_id
       WHERE coach_group_members.user_id = $1
         AND coach_group_coaches.user_id = $2
     ) AS exists`,
    [userId, actor.id]
  );

  return Boolean(result.rows[0]?.exists);
}

async function assertCanAccessCoachUser(actor: CoachCapableUser, userId: number) {
  const allowed = await canAccessCoachUser(actor, userId);
  if (!allowed) {
    throw new Error("Forbidden");
  }
}

export async function markCoachAction(userId: number) {
  await ensureDatabase();
  if (!db) throw new Error("Database unavailable");

  await db.query(
    `UPDATE users
     SET last_coach_action_at = NOW()
     WHERE id = $1
       AND role IN ('coach', 'admin')`,
    [userId]
  );
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
      ? new Set(groupsResult.rows.map((row) => row.id))
      : new Set(managedGroupIds);

  const groupsById = new Map<number, CoachGroupSummary>();
  for (const row of groupsResult.rows) {
    if (!visibleGroupIds.has(row.id)) {
      continue;
    }

    groupsById.set(row.id, {
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
      createdBy: {
        id: row.created_by,
        email: row.created_by_email,
        firstName: row.created_by_first_name,
        lastName: row.created_by_last_name,
      },
      managerCoachId: row.manager_coach_user_id,
      members: [],
      coaches: [],
    });
  }

  const groupIdsByUser = new Map<number, number[]>();
  const groupNamesByUser = new Map<number, string[]>();
  for (const row of coachesResult.rows) {
    const group = groupsById.get(row.group_id);
    if (!group) continue;

    group.coaches.push(
      toGroupParticipant({
        id: row.user_id,
        email: row.email,
        first_name: row.first_name,
        last_name: row.last_name,
        role: row.role,
        last_seen_at: row.last_seen_at,
      })
    );
  }

  for (const row of membersResult.rows) {
    const group = groupsById.get(row.group_id);
    if (!group) continue;

    group.members.push(
      toGroupParticipant({
        id: row.user_id,
        email: row.email,
        first_name: row.first_name,
        last_name: row.last_name,
        role: row.role,
      })
    );

    groupIdsByUser.set(row.user_id, [...(groupIdsByUser.get(row.user_id) ?? []), row.group_id]);
    groupNamesByUser.set(row.user_id, [...(groupNamesByUser.get(row.user_id) ?? []), group.name]);
  }

  const scopedUserRows = usersResult.rows.filter((row) => {
    const groupIds = groupIdsByUser.get(row.id) ?? [];
    const groupNames = groupNamesByUser.get(row.id) ?? [];

    if (viewer.role !== "admin" && groupIds.length === 0) {
      return false;
    }

    if (filters.userId && row.id !== filters.userId) return false;
    if (filters.groupId && !groupIds.includes(filters.groupId)) return false;
    if (filters.role && row.role !== filters.role) return false;

    return matchesDashboardSearch(
      [row.first_name, row.last_name, `${row.first_name} ${row.last_name}`.trim(), row.email, ...groupNames],
      filters.search
    );
  });

  const scopedUserIds = scopedUserRows.map((row) => row.id);
  const applicationsByUser = new Map<number, JobApplication[]>();

  if (scopedUserIds.length > 0) {
    const applicationsResult = await db.query<{
      user_id: number;
      application: JobApplication;
    }>(
      `SELECT user_id, application
       FROM user_applications
       WHERE user_id = ANY($1::bigint[])
       ORDER BY user_id ASC, position ASC`,
      [scopedUserIds]
    );

    for (const row of applicationsResult.rows) {
      const application = safeParseStoredJobApplication(
        row.application,
        `coach-dashboard:${row.user_id}`
      );
      if (!application) continue;

      applicationsByUser.set(row.user_id, [
        ...(applicationsByUser.get(row.user_id) ?? []),
        normalizeApplicationCoachNotes(application),
      ]);
    }
  }

  const users: CoachUserSummary[] = scopedUserRows.map((row) => {
    const applications = applicationsByUser.get(row.id) ?? [];

    return {
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      role: row.role,
      groupIds: groupIdsByUser.get(row.id) ?? [],
      groupNames: groupNamesByUser.get(row.id) ?? [],
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
      .map((row) =>
        toGroupParticipant({
          id: row.id,
          email: row.email,
          first_name: row.first_name,
          last_name: row.last_name,
          role: row.role,
        })
      ),
  };
}

export async function createCoachGroup(name: string, actor: CoachCapableUser) {
  await ensureDatabase();
  if (!db) throw new Error("Database unavailable");

  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Group name required");
  }

  const result = await db.query<{ id: number }>(
    `INSERT INTO coach_groups (name, created_by, manager_coach_user_id)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [trimmed, actor.id, actor.role === "coach" ? actor.id : null]
  );

  if (actor.role === "coach") {
    await db.query(
      `INSERT INTO coach_group_coaches (group_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (group_id, user_id) DO NOTHING`,
      [result.rows[0].id, actor.id]
    );
  }

  await markCoachAction(actor.id);
  await recordAuditEvent({
    actorUserId: actor.id,
    action: "group_created",
    groupId: result.rows[0].id,
    payload: { actorRole: actor.role },
  });
  logServerEvent({
    category: "coach",
    action: "group_created",
    meta: { actorUserId: actor.id, groupId: result.rows[0].id, actorRole: actor.role },
  });

  return result.rows[0];
}

export async function deleteCoachGroup(groupId: number, actor: CoachCapableUser) {
  await ensureDatabase();
  if (!db) throw new Error("Database unavailable");

  await assertCanManageCoachGroup(actor, groupId);

  await db.query(
    `DELETE FROM coach_groups
     WHERE id = $1`,
    [groupId]
  );

  await markCoachAction(actor.id);
  await recordAuditEvent({
    actorUserId: actor.id,
    action: "group_deleted",
    groupId,
    payload: { actorRole: actor.role },
  });
  logServerEvent({
    category: "coach",
    action: "group_deleted",
    meta: { actorUserId: actor.id, groupId, actorRole: actor.role },
  });
}

export async function addUserToCoachGroup(groupId: number, userId: number, actor?: CoachCapableUser) {
  await ensureDatabase();
  if (!db) throw new Error("Database unavailable");

  if (actor) {
    await assertCanManageCoachGroup(actor, groupId);
  }

  await db.query(
    `INSERT INTO coach_group_members (group_id, user_id)
     VALUES ($1, $2)
     ON CONFLICT (group_id, user_id) DO NOTHING`,
    [groupId, userId]
  );

  if (actor) {
    await markCoachAction(actor.id);
    await recordAuditEvent({
      actorUserId: actor.id,
      action: "group_member_added",
      targetUserId: userId,
      groupId,
      payload: { actorRole: actor.role },
    });
  }
}

export async function removeUserFromCoachGroup(
  groupId: number,
  userId: number,
  actor?: CoachCapableUser
) {
  await ensureDatabase();
  if (!db) throw new Error("Database unavailable");

  if (actor) {
    await assertCanManageCoachGroup(actor, groupId);
  }

  await db.query(
    `DELETE FROM coach_group_members
     WHERE group_id = $1 AND user_id = $2`,
    [groupId, userId]
  );

  if (actor) {
    await markCoachAction(actor.id);
    await recordAuditEvent({
      actorUserId: actor.id,
      action: "group_member_removed",
      targetUserId: userId,
      groupId,
      payload: { actorRole: actor.role },
    });
  }
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

export async function addCoachToGroup(
  groupId: number,
  coachUserId: number,
  actor: CoachCapableUser
) {
  await ensureDatabase();
  if (!db) throw new Error("Database unavailable");

  const allowed = await canManageCoachAssignments(actor, groupId);
  if (!allowed) {
    throw new Error("Forbidden");
  }

  const userResult = await db.query<{ role: UserRole }>(
    `SELECT role
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [coachUserId]
  );

  const role = userResult.rows[0]?.role;
  if (role !== "coach") {
    throw new Error("Coach required");
  }

  await db.query(
    `INSERT INTO coach_group_coaches (group_id, user_id)
     VALUES ($1, $2)
     ON CONFLICT (group_id, user_id) DO NOTHING`,
    [groupId, coachUserId]
  );

  await markCoachAction(actor.id);
  await recordAuditEvent({
    actorUserId: actor.id,
    action: "group_coach_assigned",
    targetUserId: coachUserId,
    groupId,
    payload: { actorRole: actor.role },
  });
}

export async function removeCoachFromGroup(
  groupId: number,
  coachUserId: number,
  actor: CoachCapableUser
) {
  await ensureDatabase();
  if (!db) throw new Error("Database unavailable");

  if (actor.role === "coach" && actor.id === coachUserId) {
    throw new Error("SelfRemovalForbidden");
  }
  const allowed = await canRemoveCoachAssignmentFromGroup(actor, groupId);
  if (!allowed) {
    throw new Error("Forbidden");
  }

  await db.query(
    `DELETE FROM coach_group_coaches
     WHERE group_id = $1
       AND user_id = $2`,
    [groupId, coachUserId]
  );

  await db.query(
    `UPDATE coach_groups
     SET manager_coach_user_id = NULL
     WHERE id = $1
       AND manager_coach_user_id = $2`,
    [groupId, coachUserId]
  );

  await markCoachAction(actor.id);
  await recordAuditEvent({
    actorUserId: actor.id,
    action: "group_coach_removed",
    targetUserId: coachUserId,
    groupId,
    payload: { actorRole: actor.role },
  });
}

export async function setCoachGroupManager(
  groupId: number,
  coachUserId: number,
  actor: AuthUser & { role: "admin" }
) {
  await ensureDatabase();
  if (!db) throw new Error("Database unavailable");

  const membershipResult = await db.query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1
       FROM coach_group_coaches
       INNER JOIN users ON users.id = coach_group_coaches.user_id
       WHERE coach_group_coaches.group_id = $1
         AND coach_group_coaches.user_id = $2
         AND users.role = 'coach'
     ) AS exists`,
    [groupId, coachUserId]
  );

  if (!membershipResult.rows[0]?.exists) {
    throw new Error("Coach assignment required");
  }

  await db.query(
    `UPDATE coach_groups
     SET manager_coach_user_id = $2
     WHERE id = $1`,
    [groupId, coachUserId]
  );

  await markCoachAction(actor.id);
  await recordAuditEvent({
    actorUserId: actor.id,
    action: "group_manager_changed",
    targetUserId: coachUserId,
    groupId,
  });
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

  const existingResult = await db.query<{ application: JobApplication }>(
    `SELECT application
     FROM user_applications
     WHERE user_id = $1 AND job_id = $2
     LIMIT 1`,
    [input.userId, input.jobId]
  );

  const existing = existingResult.rows[0]?.application
    ? parseStoredJobApplication(
        existingResult.rows[0].application,
        `coach-update:${input.userId}:${input.jobId}`
      )
    : null;
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

  await db.query(
    `UPDATE user_applications
     SET application = $3::jsonb
     WHERE user_id = $1 AND job_id = $2`,
    [input.userId, input.jobId, JSON.stringify(nextApplication)]
  );

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

function normalizeImportedStatus(value?: string) {
  const normalized = value?.trim().toLowerCase();

  switch (normalized) {
    case "in_progress":
    case "en cours":
    case "encours":
    case "in progress":
      return "in_progress" as const;
    case "follow_up":
    case "relance":
    case "a relancer":
    case "à relancer":
    case "suivi":
      return "follow_up" as const;
    case "interview":
    case "entretien":
      return "interview" as const;
    case "rejected":
    case "refuse":
    case "refusé":
    case "refusee":
    case "refusée":
    case "rejetee":
    case "rejetée":
      return "rejected" as const;
    case "accepted":
    case "accepte":
    case "accepté":
    case "acceptee":
    case "acceptée":
      return "accepted" as const;
    default:
      return "in_progress" as const;
  }
}

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

    const existingResult = await db.query<{ job_id: string }>(
      `SELECT job_id
       FROM user_applications
       WHERE user_id = $1 AND job_id = $2
       LIMIT 1`,
      [input.userId, job.id]
    );
    const existed = Boolean(existingResult?.rows[0]);

    const application = await createTrackedApplicationForUser({
      userId: input.userId,
      job,
      appliedAt: normalizeImportedDate(row.appliedAt, dateFormat),
      status: normalizeImportedStatus(row.status),
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
  await assertCanAccessCoachUser(input.actor, input.userId);

  const application = await updateApplicationForUser({
    userId: input.userId,
    jobId: input.jobId,
    patch: input.patch,
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
