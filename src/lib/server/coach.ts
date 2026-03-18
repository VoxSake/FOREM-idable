import { randomUUID } from "crypto";
import { isAfter } from "date-fns";
import {
  normalizeApplicationCoachNotes,
  toCoachNoteAuthor,
} from "@/lib/coachNotes";
import { getCurrentUser } from "@/lib/server/auth";
import { db, ensureDatabase } from "@/lib/server/db";
import { createTrackedApplicationForUser } from "@/lib/server/applications";
import { CoachNoteAuthor, CoachSharedNote, JobApplication } from "@/types/application";
import { AuthUser, UserRole } from "@/types/auth";
import { CoachDashboardData, CoachGroupSummary, CoachUserSummary } from "@/types/coach";
import { Job } from "@/types/job";

type CoachCapableUser = AuthUser & { role: "coach" | "admin" };

function canCoach(role: UserRole) {
  return role === "coach" || role === "admin";
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

export async function getCoachDashboard(viewer: CoachCapableUser): Promise<CoachDashboardData> {
  await ensureDatabase();
  if (!db) throw new Error("Database unavailable");

  const [usersResult, groupsResult, membersResult, applicationsResult] = await Promise.all([
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
    }>(
      `SELECT coach_groups.id,
              coach_groups.name,
              coach_groups.created_at,
              coach_groups.created_by,
              users.email AS created_by_email
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
      user_id: number;
      application: JobApplication;
    }>(
      `SELECT user_id, application
       FROM user_applications
       ORDER BY user_id ASC, position ASC`
    ),
  ]);

  const groupsById = new Map<number, CoachGroupSummary>();
  for (const row of groupsResult.rows) {
    groupsById.set(row.id, {
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
      createdBy: {
        id: row.created_by,
        email: row.created_by_email,
      },
      members: [],
    });
  }

  const groupIdsByUser = new Map<number, number[]>();
  const groupNamesByUser = new Map<number, string[]>();
  for (const row of membersResult.rows) {
    const group = groupsById.get(row.group_id);
    if (!group) continue;

    group.members.push({
      id: row.user_id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      role: row.role,
    });

    groupIdsByUser.set(row.user_id, [...(groupIdsByUser.get(row.user_id) ?? []), row.group_id]);
    groupNamesByUser.set(row.user_id, [...(groupNamesByUser.get(row.user_id) ?? []), group.name]);
  }

  const applicationsByUser = new Map<number, JobApplication[]>();
  for (const row of applicationsResult.rows) {
    applicationsByUser.set(row.user_id, [
      ...(applicationsByUser.get(row.user_id) ?? []),
      normalizeApplicationCoachNotes(row.application),
    ]);
  }

  const now = new Date();
  const users: CoachUserSummary[] = usersResult.rows.map((row) => {
    const applications = applicationsByUser.get(row.id) ?? [];

    return {
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      role: row.role,
      groupIds: groupIdsByUser.get(row.id) ?? [],
      groupNames: groupNamesByUser.get(row.id) ?? [],
      applicationCount: applications.length,
      interviewCount: applications.filter((item) => item.status === "interview").length,
      dueCount: applications.filter((item) => {
        const due = new Date(item.followUpDueAt);
        return (
          (item.status === "in_progress" || item.status === "follow_up") &&
          item.followUpEnabled !== false &&
          !Number.isNaN(due.getTime()) &&
          !isAfter(due, now)
        );
      }).length,
      acceptedCount: applications.filter((item) => item.status === "accepted").length,
      rejectedCount: applications.filter((item) => item.status === "rejected").length,
      inProgressCount: applications.filter((item) => item.status === "in_progress").length,
      latestActivityAt:
        applications
          .map((item) => item.updatedAt)
          .filter(Boolean)
          .sort((a, b) => (a > b ? -1 : 1))[0] ?? null,
      lastSeenAt: row.last_seen_at,
      lastCoachActionAt: row.last_coach_action_at,
      applications,
    };
  });

  return {
    viewer,
    users,
    groups: Array.from(groupsById.values()),
  };
}

export async function createCoachGroup(name: string, createdBy: number) {
  await ensureDatabase();
  if (!db) throw new Error("Database unavailable");

  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Group name required");
  }

  const result = await db.query<{ id: number }>(
    `INSERT INTO coach_groups (name, created_by)
     VALUES ($1, $2)
     RETURNING id`,
    [trimmed, createdBy]
  );

  await markCoachAction(createdBy);

  return result.rows[0];
}

export async function deleteCoachGroup(groupId: number, actorId?: number) {
  await ensureDatabase();
  if (!db) throw new Error("Database unavailable");

  await db.query(
    `DELETE FROM coach_groups
     WHERE id = $1`,
    [groupId]
  );

  if (actorId) {
    await markCoachAction(actorId);
  }
}

export async function addUserToCoachGroup(groupId: number, userId: number, actorId?: number) {
  await ensureDatabase();
  if (!db) throw new Error("Database unavailable");

  await db.query(
    `INSERT INTO coach_group_members (group_id, user_id)
     VALUES ($1, $2)
     ON CONFLICT (group_id, user_id) DO NOTHING`,
    [groupId, userId]
  );

  if (actorId) {
    await markCoachAction(actorId);
  }
}

export async function removeUserFromCoachGroup(groupId: number, userId: number, actorId?: number) {
  await ensureDatabase();
  if (!db) throw new Error("Database unavailable");

  await db.query(
    `DELETE FROM coach_group_members
     WHERE group_id = $1 AND user_id = $2`,
    [groupId, userId]
  );

  if (actorId) {
    await markCoachAction(actorId);
  }
}

export async function setUserRole(userId: number, role: UserRole, actorId?: number) {
  await ensureDatabase();
  if (!db) throw new Error("Database unavailable");

  await db.query(
    `UPDATE users
     SET role = $2
     WHERE id = $1`,
    [userId, role]
  );

  if (actorId) {
    await markCoachAction(actorId);
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
  const actor = toCoachNoteAuthor(input.actor);

  const existingResult = await db.query<{ application: JobApplication }>(
    `SELECT application
     FROM user_applications
     WHERE user_id = $1 AND job_id = $2
     LIMIT 1`,
    [input.userId, input.jobId]
  );

  const existing = existingResult.rows[0]?.application;
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
  appliedAt?: string;
  status?: JobApplication["status"];
  notes?: string;
}

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

function normalizeImportedDate(value?: string) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }

  const frenchMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2}|\d{4})$/);
  if (frenchMatch) {
    const [, day, month, year] = frenchMatch;
    const normalizedYear = year.length === 2 ? `20${year}` : year;
    const isoCandidate = `${normalizedYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    const parsed = new Date(`${isoCandidate}T00:00:00.000Z`);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function buildImportedManualJob(input: CoachImportedApplicationInput): Job {
  const appliedAt = normalizeImportedDate(input.appliedAt) ?? new Date().toISOString();
  const fingerprint = `${input.company}|${input.title}|${appliedAt}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return {
    id: `manual-import-${fingerprint || Math.random().toString(36).slice(2, 8)}`,
    title: input.title.trim(),
    company: input.company.trim(),
    location: "Non précisé",
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
}) {
  const importedApplications: JobApplication[] = [];

  for (const row of input.rows) {
    if (!row.company.trim() || !row.title.trim()) {
      continue;
    }

    const application = await createTrackedApplicationForUser({
      userId: input.userId,
      job: buildImportedManualJob(row),
      appliedAt: normalizeImportedDate(row.appliedAt),
      status: normalizeImportedStatus(row.status),
      notes: row.notes?.trim(),
    });

    importedApplications.push(application);
  }

  await markCoachAction(input.actor.id);

  return importedApplications;
}
