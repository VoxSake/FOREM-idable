import { recordAuditEvent } from "@/lib/server/auditLog";
import { db, ensureDatabase } from "@/lib/server/db";
import { logServerEvent } from "@/lib/server/observability";
import { AuthUser, UserRole } from "@/types/auth";

export type CoachCapableUser = AuthUser & { role: "coach" | "admin" };

function toNumericId(value: number | string | null | undefined) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export async function getManagedGroupIdsForCoach(userId: number) {
  await ensureDatabase();
  if (!db) throw new Error("Database unavailable");

  const result = await db.query<{ group_id: number }>(
    `SELECT group_id
     FROM coach_group_coaches
     WHERE user_id = $1`,
    [userId]
  );

  return result.rows
    .map((row) => toNumericId(row.group_id))
    .filter((groupId): groupId is number => groupId !== null);
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

export async function assertCanManageCoachGroup(actor: CoachCapableUser, groupId: number) {
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

export async function assertCanAccessCoachUser(actor: CoachCapableUser, userId: number) {
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

export async function addUserToCoachGroup(
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
