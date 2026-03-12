import { isAfter } from "date-fns";
import { getCurrentUser } from "@/lib/server/auth";
import { db, ensureDatabase } from "@/lib/server/db";
import { JobApplication } from "@/types/application";
import { AuthUser, UserRole } from "@/types/auth";
import { CoachDashboardData, CoachGroupSummary, CoachUserSummary } from "@/types/coach";

type CoachCapableUser = AuthUser & { role: "coach" | "admin" };

function canCoach(role: UserRole) {
  return role === "coach" || role === "admin";
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
      role: UserRole;
    }>(
      `SELECT id, email, role
       FROM users
       ORDER BY email ASC`
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
      role: UserRole;
    }>(
      `SELECT coach_group_members.group_id,
              users.id AS user_id,
              users.email,
              users.role
       FROM coach_group_members
       INNER JOIN users ON users.id = coach_group_members.user_id
       ORDER BY users.email ASC`
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
      role: row.role,
    });

    groupIdsByUser.set(row.user_id, [...(groupIdsByUser.get(row.user_id) ?? []), row.group_id]);
    groupNamesByUser.set(row.user_id, [...(groupNamesByUser.get(row.user_id) ?? []), group.name]);
  }

  const applicationsByUser = new Map<number, JobApplication[]>();
  for (const row of applicationsResult.rows) {
    applicationsByUser.set(row.user_id, [...(applicationsByUser.get(row.user_id) ?? []), row.application]);
  }

  const now = new Date();
  const users: CoachUserSummary[] = usersResult.rows.map((row) => {
    const applications = applicationsByUser.get(row.id) ?? [];

    return {
      id: row.id,
      email: row.email,
      role: row.role,
      groupIds: groupIdsByUser.get(row.id) ?? [],
      groupNames: groupNamesByUser.get(row.id) ?? [],
      applicationCount: applications.length,
      interviewCount: applications.filter((item) => item.status === "interview").length,
      dueCount: applications.filter((item) => {
        const due = new Date(item.followUpDueAt);
        return (
          (item.status === "in_progress" || item.status === "follow_up") &&
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

  return result.rows[0];
}

export async function deleteCoachGroup(groupId: number) {
  await ensureDatabase();
  if (!db) throw new Error("Database unavailable");

  await db.query(
    `DELETE FROM coach_groups
     WHERE id = $1`,
    [groupId]
  );
}

export async function addUserToCoachGroup(groupId: number, userId: number) {
  await ensureDatabase();
  if (!db) throw new Error("Database unavailable");

  await db.query(
    `INSERT INTO coach_group_members (group_id, user_id)
     VALUES ($1, $2)
     ON CONFLICT (group_id, user_id) DO NOTHING`,
    [groupId, userId]
  );
}

export async function removeUserFromCoachGroup(groupId: number, userId: number) {
  await ensureDatabase();
  if (!db) throw new Error("Database unavailable");

  await db.query(
    `DELETE FROM coach_group_members
     WHERE group_id = $1 AND user_id = $2`,
    [groupId, userId]
  );
}

export async function setUserRole(userId: number, role: UserRole) {
  await ensureDatabase();
  if (!db) throw new Error("Database unavailable");

  await db.query(
    `UPDATE users
     SET role = $2
     WHERE id = $1`,
    [userId, role]
  );
}
