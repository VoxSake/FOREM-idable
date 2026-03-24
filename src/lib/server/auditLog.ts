import { db, ensureDatabase } from "@/lib/server/db";

export type AuditAction =
  | "admin_role_changed"
  | "api_key_revoked"
  | "user_deleted"
  | "user_profile_updated"
  | "featured_search_created"
  | "featured_search_updated"
  | "featured_search_deleted"
  | "group_created"
  | "group_deleted"
  | "group_member_added"
  | "group_member_removed"
  | "group_coach_assigned"
  | "group_coach_removed"
  | "group_manager_changed"
  | "coach_csv_import_completed";

export async function recordAuditEvent(input: {
  actorUserId: number;
  action: AuditAction;
  targetUserId?: number | null;
  groupId?: number | null;
  payload?: Record<string, unknown> | null;
}) {
  await ensureDatabase();
  if (!db) throw new Error("Database unavailable");

  await db.query(
    `INSERT INTO audit_logs (actor_user_id, action, target_user_id, group_id, payload)
     VALUES ($1, $2, $3, $4, $5::jsonb)`,
    [
      input.actorUserId,
      input.action,
      input.targetUserId ?? null,
      input.groupId ?? null,
      JSON.stringify(input.payload ?? {}),
    ]
  );
}
