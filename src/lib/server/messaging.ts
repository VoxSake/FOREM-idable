import { db, ensureDatabase } from "@/lib/server/db";
import { AuthUser } from "@/types/auth";
import { ConversationPreview } from "@/types/messaging";

type Queryable = NonNullable<typeof db>;

function toNumericId(value: number | string | null | undefined) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function getDisplayName(input: { firstName: string; lastName: string; email: string }) {
  const fullName = `${input.firstName} ${input.lastName}`.trim();
  return fullName || input.email;
}

async function listAccessibleGroupIds(queryable: Queryable, actor: AuthUser) {
  if (actor.role === "admin") {
    const result = await queryable.query<{ id: number }>(
      `SELECT id
       FROM coach_groups`
    );

    return result.rows
      .map((row) => toNumericId(row.id))
      .filter((groupId): groupId is number => groupId !== null);
  }

  const result = await queryable.query<{ group_id: number }>(
    `SELECT DISTINCT group_id
     FROM (
       SELECT group_id
       FROM coach_group_members
       WHERE user_id = $1
       UNION
       SELECT group_id
       FROM coach_group_coaches
       WHERE user_id = $1
       UNION
       SELECT id AS group_id
       FROM coach_groups
       WHERE manager_coach_user_id = $1
     ) scoped_groups`,
    [actor.id]
  );

  return result.rows
    .map((row) => toNumericId(row.group_id))
    .filter((groupId): groupId is number => groupId !== null);
}

async function ensureGroupConversations(queryable: Queryable, actor: AuthUser, groupIds: number[]) {
  for (const groupId of groupIds) {
    const existingConversation = await queryable.query<{ id: number }>(
      `SELECT id
       FROM conversations
       WHERE group_id = $1
       LIMIT 1`,
      [groupId]
    );

    const conversationId =
      existingConversation.rows[0]?.id ??
      (
        await queryable.query<{ id: number }>(
          `INSERT INTO conversations (type, group_id, created_by_user_id)
           VALUES ('group', $1, $2)
           ON CONFLICT (group_id)
           DO UPDATE SET last_message_at = conversations.last_message_at
           RETURNING id`,
          [groupId, actor.id]
        )
      ).rows[0]?.id;

    if (!conversationId) {
      continue;
    }

    const activeParticipants = await queryable.query<{
      user_id: number;
      role: AuthUser["role"];
    }>(
      `SELECT DISTINCT participant.user_id,
              participant.role
       FROM (
         SELECT users.id AS user_id,
                users.role AS role
         FROM coach_group_members
         INNER JOIN users ON users.id = coach_group_members.user_id
         WHERE coach_group_members.group_id = $1
         UNION
         SELECT users.id AS user_id,
                users.role AS role
         FROM coach_group_coaches
         INNER JOIN users ON users.id = coach_group_coaches.user_id
         WHERE coach_group_coaches.group_id = $1
         UNION
         SELECT users.id AS user_id,
                users.role AS role
         FROM coach_groups
         INNER JOIN users ON users.id = coach_groups.manager_coach_user_id
         WHERE coach_groups.id = $1
           AND coach_groups.manager_coach_user_id IS NOT NULL
       ) participant`,
      [groupId]
    );

    const participantIds = activeParticipants.rows
      .map((row) => toNumericId(row.user_id))
      .filter((userId): userId is number => userId !== null);

    for (const row of activeParticipants.rows) {
      const userId = toNumericId(row.user_id);
      if (userId === null) continue;

      await queryable.query(
        `INSERT INTO conversation_participants (
           conversation_id,
           user_id,
           role_snapshot,
           joined_at,
           left_at
         )
         VALUES ($1, $2, $3, NOW(), NULL)
         ON CONFLICT (conversation_id, user_id)
         DO UPDATE SET
           role_snapshot = EXCLUDED.role_snapshot,
           left_at = NULL`,
        [conversationId, userId, row.role]
      );
    }

    await queryable.query(
      `UPDATE conversation_participants
       SET left_at = NOW()
       WHERE conversation_id = $1
         AND user_id <> ALL($2::bigint[])
         AND left_at IS NULL`,
      [conversationId, participantIds.length > 0 ? participantIds : [0]]
    );
  }
}

export async function canDirectMessage(actor: AuthUser, targetUserId: number) {
  if (actor.id === targetUserId) {
    return false;
  }

  await ensureDatabase();
  if (!db) throw new Error("Database unavailable");

  if (actor.role === "admin") {
    return true;
  }

  const result = await db.query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1
       FROM (
         SELECT group_id
         FROM coach_group_members
         WHERE user_id = $1
         UNION
         SELECT group_id
         FROM coach_group_coaches
         WHERE user_id = $1
         UNION
         SELECT id AS group_id
         FROM coach_groups
         WHERE manager_coach_user_id = $1
       ) actor_groups
       INNER JOIN (
         SELECT group_id
         FROM coach_group_members
         WHERE user_id = $2
         UNION
         SELECT group_id
         FROM coach_group_coaches
         WHERE user_id = $2
         UNION
         SELECT id AS group_id
         FROM coach_groups
         WHERE manager_coach_user_id = $2
       ) target_groups
         ON target_groups.group_id = actor_groups.group_id
     ) AS exists`,
    [actor.id, targetUserId]
  );

  return Boolean(result.rows[0]?.exists);
}

export async function listVisibleConversations(actor: AuthUser): Promise<ConversationPreview[]> {
  await ensureDatabase();
  if (!db) throw new Error("Database unavailable");

  const groupIds = await listAccessibleGroupIds(db, actor);
  await ensureGroupConversations(db, actor, groupIds);

  const rows = await db.query<{
    id: number;
    type: ConversationPreview["type"];
    group_id: number | null;
    group_name: string | null;
    last_message_at: string;
    last_message_preview: string | null;
    participant_count: number;
    unread_count: number;
    other_user_first_name: string | null;
    other_user_last_name: string | null;
    other_user_email: string | null;
  }>(
    `SELECT conversations.id,
            conversations.type,
            conversations.group_id,
            coach_groups.name AS group_name,
            conversations.last_message_at,
            latest_message.content AS last_message_preview,
            COUNT(DISTINCT active_participants.user_id)::int AS participant_count,
            COUNT(DISTINCT unread_messages.id)::int AS unread_count,
            other_user.first_name AS other_user_first_name,
            other_user.last_name AS other_user_last_name,
            other_user.email AS other_user_email
     FROM conversations
     LEFT JOIN coach_groups ON coach_groups.id = conversations.group_id
     LEFT JOIN conversation_participants active_participants
       ON active_participants.conversation_id = conversations.id
      AND active_participants.left_at IS NULL
     LEFT JOIN LATERAL (
       SELECT conversation_messages.content
       FROM conversation_messages
       WHERE conversation_messages.conversation_id = conversations.id
         AND conversation_messages.deleted_at IS NULL
       ORDER BY conversation_messages.created_at DESC
       LIMIT 1
     ) latest_message ON TRUE
     LEFT JOIN conversation_reads
       ON conversation_reads.conversation_id = conversations.id
      AND conversation_reads.user_id = $1
     LEFT JOIN conversation_messages unread_messages
       ON unread_messages.conversation_id = conversations.id
      AND unread_messages.deleted_at IS NULL
      AND unread_messages.author_user_id IS DISTINCT FROM $1
      AND (
        conversation_reads.last_read_at IS NULL
        OR unread_messages.created_at > conversation_reads.last_read_at
      )
     LEFT JOIN LATERAL (
       SELECT users.first_name,
              users.last_name,
              users.email
       FROM conversation_participants
       INNER JOIN users ON users.id = conversation_participants.user_id
       WHERE conversation_participants.conversation_id = conversations.id
         AND conversation_participants.user_id <> $1
         AND conversation_participants.left_at IS NULL
       ORDER BY conversation_participants.joined_at ASC
       LIMIT 1
     ) other_user ON TRUE
     WHERE (
       conversations.type = 'group'
       AND conversations.group_id = ANY($2::bigint[])
     ) OR (
       conversations.type = 'direct'
       AND EXISTS (
         SELECT 1
         FROM conversation_participants
         WHERE conversation_participants.conversation_id = conversations.id
           AND conversation_participants.user_id = $1
           AND conversation_participants.left_at IS NULL
       )
     )
     GROUP BY conversations.id,
              conversations.type,
              conversations.group_id,
              coach_groups.name,
              conversations.last_message_at,
              latest_message.content,
              other_user.first_name,
              other_user.last_name,
              other_user.email
     ORDER BY conversations.last_message_at DESC, conversations.id DESC`,
    [actor.id, groupIds.length > 0 ? groupIds : [0]]
  );

  return rows.rows.map((row) => ({
    id: row.id,
    type: row.type,
    groupId: toNumericId(row.group_id),
    title:
      row.type === "group"
        ? row.group_name || "Groupe"
        : getDisplayName({
            firstName: row.other_user_first_name || "",
            lastName: row.other_user_last_name || "",
            email: row.other_user_email || "Message privé",
          }),
    subtitle:
      row.type === "group"
        ? `${row.participant_count} participant${row.participant_count > 1 ? "s" : ""}`
        : row.other_user_email,
    lastMessageAt: row.last_message_at,
    unreadCount: row.unread_count,
    participantCount: row.participant_count,
  }));
}
