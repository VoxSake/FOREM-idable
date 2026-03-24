import { db, ensureDatabase } from "@/lib/server/db";
import { isValidForemOfferId } from "@/lib/forem";
import { fetchForemJobByOfferId } from "@/services/api/foremClient";
import { AuthUser, UserRole } from "@/types/auth";
import { Job } from "@/types/job";
import {
  ConversationDetail,
  ConversationMessage,
  ConversationMessageAuthor,
  ConversationParticipantSummary,
  ConversationPreview,
  DirectMessageTarget,
} from "@/types/messaging";

type Queryable = NonNullable<typeof db>;

type ParticipantRow = {
  user_id: number | string;
  first_name: string;
  last_name: string;
  email: string;
  role_snapshot: UserRole;
  joined_at: string;
  left_at: string | null;
};

type MessageRow = {
  id: number | string;
  conversation_id: number | string;
  type: ConversationMessage["type"];
  content: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
  author_user_id: number | string | null;
  author_first_name: string | null;
  author_last_name: string | null;
  author_email: string | null;
  author_role: UserRole | null;
};

type ConversationSummaryRow = {
  id: number | string;
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
};

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

function normalizeConversationPreview(row: ConversationSummaryRow): ConversationPreview {
  const conversationId = toNumericId(row.id) ?? 0;

  return {
    id: conversationId,
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
    lastMessagePreview: row.last_message_preview,
    unreadCount: row.unread_count,
    participantCount: row.participant_count,
  };
}

function toConversationMessageAuthor(row: MessageRow): ConversationMessageAuthor | null {
  const authorUserId = toNumericId(row.author_user_id);
  if (authorUserId === null) {
    return null;
  }

  return {
    userId: authorUserId,
    firstName: row.author_first_name || "",
    lastName: row.author_last_name || "",
    email: row.author_email || "",
    role: row.author_role || "user",
  };
}

function toConversationMessage(row: MessageRow, actorId: number): ConversationMessage {
  const messageId = toNumericId(row.id) ?? 0;
  const conversationId = toNumericId(row.conversation_id) ?? 0;
  const authorUserId = toNumericId(row.author_user_id);

  return {
    id: messageId,
    conversationId,
    type: row.type,
    content: row.content,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    editedAt: row.edited_at,
    deletedAt: row.deleted_at,
    author: toConversationMessageAuthor(row),
    isOwnMessage: authorUserId === actorId,
  };
}

function extractForemOfferIdFromText(content: string): { offerId: string; url: string } | null {
  const match = content.match(
    /https?:\/\/(?:www\.)?leforem\.be\/recherche-offres\/offre-detail\/(\d+)(?:[/?#][^\s]*)?/i
  );
  if (!match) {
    return null;
  }

  const offerId = match[1]?.trim() ?? "";
  if (!isValidForemOfferId(offerId)) {
    return null;
  }

  return {
    offerId,
    url: match[0],
  };
}

async function resolveSharedJobMetadata(content: string): Promise<{
  type: ConversationMessage["type"];
  metadata: Record<string, unknown> & {
    sharedJob?: Job;
    sharedOfferId?: string;
    sharedUrl?: string;
  };
}> {
  const extracted = extractForemOfferIdFromText(content);
  if (!extracted) {
    return {
      type: "text",
      metadata: {},
    };
  }

  try {
    const sharedJob = await fetchForemJobByOfferId(extracted.offerId);
    if (!sharedJob) {
      return {
        type: "text",
        metadata: {},
      };
    }

    return {
      type: "job_share",
      metadata: {
        sharedJob,
        sharedOfferId: extracted.offerId,
        sharedUrl: extracted.url,
      },
    };
  } catch (error) {
    console.error("Unable to resolve Forem offer preview for messaging", error);
    return {
      type: "text",
      metadata: {},
    };
  }
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

    if (!conversationId) continue;

    const activeParticipants = await queryable.query<{
      user_id: number;
      role: UserRole;
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

async function loadConversationSummaries(
  queryable: Queryable,
  actor: AuthUser,
  groupIds: number[]
) {
  return queryable.query<ConversationSummaryRow>(
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
      AND unread_messages.id > COALESCE(conversation_reads.last_read_message_id, 0)
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
     ORDER BY CASE WHEN conversations.type = 'group' THEN 0 ELSE 1 END,
              conversations.last_message_at DESC,
              conversations.id DESC`,
    [actor.id, groupIds.length > 0 ? groupIds : [0]]
  );
}

async function getAccessibleConversationMap(queryable: Queryable, actor: AuthUser) {
  const groupIds = await listAccessibleGroupIds(queryable, actor);
  await ensureGroupConversations(queryable, actor, groupIds);
  const summaries = await loadConversationSummaries(queryable, actor, groupIds);

  return new Map(
    summaries.rows.map((row) => [toNumericId(row.id) ?? 0, normalizeConversationPreview(row)])
  );
}

async function assertCanAccessConversation(queryable: Queryable, actor: AuthUser, conversationId: number) {
  const conversations = await getAccessibleConversationMap(queryable, actor);
  const conversation = conversations.get(conversationId) ?? null;

  if (!conversation) {
    throw new Error("Forbidden");
  }

  return conversation;
}

export async function canModerateGroupConversation(
  queryable: Queryable,
  actor: AuthUser,
  conversationId: number
) {
  const conversationResult = await queryable.query<{
    type: ConversationPreview["type"];
    group_id: number | null;
  }>(
    `SELECT type, group_id
     FROM conversations
     WHERE id = $1
     LIMIT 1`,
    [conversationId]
  );

  const conversation = conversationResult.rows[0];
  if (!conversation || conversation.type !== "group" || !conversation.group_id) {
    return false;
  }

  if (actor.role === "admin") {
    return true;
  }

  const moderationScope = await queryable.query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1
       FROM coach_group_coaches
       WHERE coach_group_coaches.group_id = $1
         AND coach_group_coaches.user_id = $2
       UNION
       SELECT 1
       FROM coach_groups
       WHERE coach_groups.id = $1
         AND coach_groups.manager_coach_user_id = $2
     ) AS exists`,
    [conversation.group_id, actor.id]
  );

  return Boolean(moderationScope.rows[0]?.exists);
}

async function loadConversationParticipants(queryable: Queryable, conversationId: number) {
  const result = await queryable.query<ParticipantRow>(
    `SELECT conversation_participants.user_id,
            users.first_name,
            users.last_name,
            users.email,
            conversation_participants.role_snapshot,
            conversation_participants.joined_at,
            conversation_participants.left_at
     FROM conversation_participants
     INNER JOIN users ON users.id = conversation_participants.user_id
     WHERE conversation_participants.conversation_id = $1
     ORDER BY conversation_participants.left_at NULLS FIRST,
              conversation_participants.joined_at ASC`,
    [conversationId]
  );

  return result.rows.map(
    (row): ConversationParticipantSummary => ({
      userId: toNumericId(row.user_id) ?? 0,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      role: row.role_snapshot,
      joinedAt: row.joined_at,
      leftAt: row.left_at,
    })
  );
}

async function loadConversationMessages(queryable: Queryable, actor: AuthUser, conversationId: number) {
  const result = await queryable.query<MessageRow>(
    `SELECT conversation_messages.id,
            conversation_messages.conversation_id,
            conversation_messages.type,
            conversation_messages.content,
            conversation_messages.metadata,
            conversation_messages.created_at,
            conversation_messages.edited_at,
            conversation_messages.deleted_at,
            conversation_messages.author_user_id,
            users.first_name AS author_first_name,
            users.last_name AS author_last_name,
            users.email AS author_email,
            users.role AS author_role
     FROM conversation_messages
     LEFT JOIN users ON users.id = conversation_messages.author_user_id
     WHERE conversation_messages.conversation_id = $1
     ORDER BY conversation_messages.created_at ASC, conversation_messages.id ASC`,
    [conversationId]
  );

  return result.rows.map((row) => toConversationMessage(row, actor.id));
}

async function markConversationAsReadInternal(
  queryable: Queryable,
  actor: AuthUser,
  conversationId: number
) {
  const latestMessageResult = await queryable.query<{ id: number; created_at: string }>(
    `SELECT id, created_at
     FROM conversation_messages
     WHERE conversation_id = $1
       AND deleted_at IS NULL
     ORDER BY created_at DESC, id DESC
     LIMIT 1`,
    [conversationId]
  );

  const latestMessage = latestMessageResult.rows[0];
  if (!latestMessage) {
    return false;
  }

  await queryable.query(
    `INSERT INTO conversation_reads (
       conversation_id,
       user_id,
       last_read_message_id,
       last_read_at
     )
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (conversation_id, user_id)
     DO UPDATE SET
       last_read_message_id = CASE
         WHEN EXCLUDED.last_read_at > conversation_reads.last_read_at
           OR (
             EXCLUDED.last_read_at = conversation_reads.last_read_at
             AND EXCLUDED.last_read_message_id > conversation_reads.last_read_message_id
           )
         THEN EXCLUDED.last_read_message_id
         ELSE conversation_reads.last_read_message_id
       END,
       last_read_at = CASE
         WHEN EXCLUDED.last_read_at > conversation_reads.last_read_at
           OR (
             EXCLUDED.last_read_at = conversation_reads.last_read_at
             AND EXCLUDED.last_read_message_id > conversation_reads.last_read_message_id
           )
         THEN EXCLUDED.last_read_at
         ELSE conversation_reads.last_read_at
       END`,
    [conversationId, actor.id, latestMessage.id, latestMessage.created_at]
  );

  return true;
}

async function getUserSummary(queryable: Queryable, userId: number) {
  const result = await queryable.query<{
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    role: UserRole;
  }>(
    `SELECT id, first_name, last_name, email, role
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [userId]
  );

  return result.rows[0] ?? null;
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

  const conversations = await getAccessibleConversationMap(db, actor);
  return Array.from(conversations.values());
}

export async function getConversationDetail(
  actor: AuthUser,
  conversationId: number
): Promise<ConversationDetail> {
  await ensureDatabase();
  if (!db) throw new Error("Database unavailable");

  const preview = await assertCanAccessConversation(db, actor, conversationId);
  const [participants, messages, canModerateMessages] = await Promise.all([
    loadConversationParticipants(db, conversationId),
    loadConversationMessages(db, actor, conversationId),
    canModerateGroupConversation(db, actor, conversationId),
  ]);

  return {
    ...preview,
    canModerateMessages,
    participants,
    messages,
  };
}

export async function markConversationAsRead(actor: AuthUser, conversationId: number) {
  await ensureDatabase();
  if (!db) throw new Error("Database unavailable");

  await assertCanAccessConversation(db, actor, conversationId);
  return markConversationAsReadInternal(db, actor, conversationId);
}

export async function sendTextMessage(
  actor: AuthUser,
  conversationId: number,
  content: string
): Promise<ConversationMessage | { command: "clean" }> {
  await ensureDatabase();
  if (!db) throw new Error("Database unavailable");

  const preview = await assertCanAccessConversation(db, actor, conversationId);

  const conversationResult = await db.query<{ type: ConversationPreview["type"] }>(
    `SELECT type
     FROM conversations
     WHERE id = $1
     LIMIT 1`,
    [conversationId]
  );
  const conversationType = conversationResult.rows[0]?.type ?? "group";
  const normalizedContent = content.trim();

  if (normalizedContent === "/clean") {
    const canModerate = await canModerateGroupConversation(db, actor, conversationId);
    if (preview.type !== "group" || !canModerate) {
      throw new Error("Forbidden");
    }

    await db.query(
      `DELETE FROM conversation_messages
       WHERE conversation_id = $1`,
      [conversationId]
    );

    await db.query(
      `DELETE FROM conversation_reads
       WHERE conversation_id = $1`,
      [conversationId]
    );

    await db.query(
      `UPDATE conversations
       SET last_message_at = NOW()
       WHERE id = $1`,
      [conversationId]
    );

    return { command: "clean" };
  }

  const messagePayload = await resolveSharedJobMetadata(normalizedContent);

  const result = await db.query<MessageRow>(
    `INSERT INTO conversation_messages (
       conversation_id,
       author_user_id,
       type,
       content,
       metadata
     )
     VALUES ($1, $2, $3, $4, $5::jsonb)
     RETURNING id,
               conversation_id,
               type,
               content,
               metadata,
               created_at,
               edited_at,
               deleted_at,
               author_user_id,
               NULL::text AS author_first_name,
               NULL::text AS author_last_name,
               NULL::text AS author_email,
               NULL::text AS author_role`,
    [
      conversationId,
      actor.id,
      messagePayload.type,
      normalizedContent,
      JSON.stringify(messagePayload.metadata),
    ]
  );

  await db.query(
    `UPDATE conversations
     SET last_message_at = NOW()
     WHERE id = $1`,
    [conversationId]
  );

  if (conversationType === "direct") {
    await db.query(
      `UPDATE conversation_participants
       SET left_at = NULL
       WHERE conversation_id = $1`,
      [conversationId]
    );
  }

  await markConversationAsReadInternal(db, actor, conversationId);

  const author = await getUserSummary(db, actor.id);
  const row = result.rows[0];

  return toConversationMessage(
    {
      ...row,
      author_first_name: author?.first_name ?? actor.firstName,
      author_last_name: author?.last_name ?? actor.lastName,
      author_email: author?.email ?? actor.email,
      author_role: author?.role ?? actor.role,
    },
    actor.id
  );
}

export async function listDirectMessageTargets(actor: AuthUser): Promise<DirectMessageTarget[]> {
  await ensureDatabase();
  if (!db) throw new Error("Database unavailable");

  if (actor.role === "admin") {
    const result = await db.query<{
      id: number;
      first_name: string;
      last_name: string;
      email: string;
      role: UserRole;
    }>(
      `SELECT id, first_name, last_name, email, role
       FROM users
       WHERE id <> $1
       ORDER BY first_name ASC, last_name ASC, email ASC`,
      [actor.id]
    );

    return result.rows.map((row) => ({
      userId: toNumericId(row.id) ?? 0,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      role: row.role,
      sharedGroupCount: 0,
      relationLabel: "Accès global",
    }));
  }

  const result = await db.query<{
    user_id: number;
    first_name: string;
    last_name: string;
    email: string;
    role: UserRole;
    shared_group_count: number;
  }>(
    `SELECT candidate.user_id,
            users.first_name,
            users.last_name,
            users.email,
            users.role,
            COUNT(DISTINCT candidate.group_id)::int AS shared_group_count
     FROM (
       SELECT coach_group_members.user_id,
              coach_group_members.group_id
       FROM coach_group_members
       WHERE coach_group_members.group_id IN (
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
       )
       UNION ALL
       SELECT coach_group_coaches.user_id,
              coach_group_coaches.group_id
       FROM coach_group_coaches
       WHERE coach_group_coaches.group_id IN (
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
       )
       UNION ALL
       SELECT coach_groups.manager_coach_user_id AS user_id,
              coach_groups.id AS group_id
       FROM coach_groups
       WHERE coach_groups.id IN (
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
       )
         AND coach_groups.manager_coach_user_id IS NOT NULL
     ) candidate
     INNER JOIN users ON users.id = candidate.user_id
     WHERE candidate.user_id <> $1
     GROUP BY candidate.user_id,
              users.first_name,
              users.last_name,
              users.email,
              users.role
     ORDER BY users.first_name ASC, users.last_name ASC, users.email ASC`,
    [actor.id]
  );

  return result.rows.map((row) => ({
    userId: toNumericId(row.user_id) ?? 0,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    role: row.role,
    sharedGroupCount: row.shared_group_count,
    relationLabel: `${row.shared_group_count} groupe${row.shared_group_count > 1 ? "s" : ""} commun${row.shared_group_count > 1 ? "s" : ""}`,
  }));
}

export async function findOrCreateDirectConversation(actor: AuthUser, targetUserId: number) {
  await ensureDatabase();
  if (!db) throw new Error("Database unavailable");

  const conversationId = await findOrCreateDirectConversationId(actor, targetUserId);
  return getConversationDetail(actor, conversationId);
}

export async function findOrCreateDirectConversationId(actor: AuthUser, targetUserId: number) {
  await ensureDatabase();
  if (!db) throw new Error("Database unavailable");

  const [userAId, userBId] =
    actor.id < targetUserId ? [actor.id, targetUserId] : [targetUserId, actor.id];

  const existing = await db.query<{ id: number }>(
    `SELECT id
     FROM conversations
     WHERE type = 'direct'
       AND direct_user_a_id = $1
       AND direct_user_b_id = $2
     LIMIT 1`,
    [userAId, userBId]
  );

  const targetUser = await getUserSummary(db, targetUserId);
  if (!targetUser) {
    throw new Error("NotFound");
  }

  if (!existing.rows[0]?.id) {
    const canMessage = await canDirectMessage(actor, targetUserId);
    if (!canMessage) {
      throw new Error("Forbidden");
    }
  }

  const conversationId =
    existing.rows[0]?.id ??
    (
      await db.query<{ id: number }>(
        `INSERT INTO conversations (
           type,
           direct_user_a_id,
           direct_user_b_id,
           created_by_user_id
         )
         VALUES ('direct', $1, $2, $3)
         ON CONFLICT (type, direct_user_a_id, direct_user_b_id)
         DO UPDATE SET last_message_at = conversations.last_message_at
         RETURNING id`,
        [userAId, userBId, actor.id]
      )
    ).rows[0]?.id;

  if (!conversationId) {
    throw new Error("ConversationCreateFailed");
  }

  const participants = [
    {
      userId: actor.id,
      role: actor.role,
    },
    {
      userId: toNumericId(targetUser.id) ?? targetUserId,
      role: targetUser.role,
    },
  ];

  for (const participant of participants) {
    await db.query(
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
      [conversationId, participant.userId, participant.role]
    );
  }

  return conversationId;
}

export async function shareTextInDirectConversation(
  actor: AuthUser,
  targetUserId: number,
  content: string
) {
  const conversationId = await findOrCreateDirectConversationId(actor, targetUserId);
  const message = await sendTextMessage(actor, conversationId, content);

  if ("command" in message) {
    throw new Error("InvalidDirectMessageContent");
  }

  return { conversationId, message };
}

export async function closeDirectConversation(actor: AuthUser, conversationId: number) {
  await ensureDatabase();
  if (!db) throw new Error("Database unavailable");

  const preview = await assertCanAccessConversation(db, actor, conversationId);
  if (preview.type !== "direct") {
    throw new Error("InvalidConversationType");
  }

  await db.query(
    `UPDATE conversation_participants
     SET left_at = NOW()
     WHERE conversation_id = $1
       AND user_id = $2
       AND left_at IS NULL`,
    [conversationId, actor.id]
  );

  return true;
}

export async function deleteConversationMessage(
  actor: AuthUser,
  conversationId: number,
  messageId: number
) {
  await ensureDatabase();
  if (!db) throw new Error("Database unavailable");

  await assertCanAccessConversation(db, actor, conversationId);

  const messageResult = await db.query<{
    author_user_id: number | string | null;
    deleted_at: string | null;
  }>(
    `SELECT author_user_id, deleted_at
     FROM conversation_messages
     WHERE id = $1
       AND conversation_id = $2
     LIMIT 1`,
    [messageId, conversationId]
  );

  const targetMessage = messageResult.rows[0];
  if (!targetMessage || targetMessage.deleted_at) {
    throw new Error("NotFound");
  }

  const authorUserId = toNumericId(targetMessage.author_user_id);
  if (authorUserId === actor.id) {
    await db.query(
      `DELETE FROM conversation_messages
       WHERE id = $1
         AND conversation_id = $2`,
      [messageId, conversationId]
    );

    return null;
  }

  const canModerate = await canModerateGroupConversation(db, actor, conversationId);
  if (!canModerate) {
    throw new Error("Forbidden");
  }

  const result = await db.query<MessageRow>(
    `UPDATE conversation_messages
     SET content = NULL,
         metadata = '{}'::jsonb,
         deleted_at = NOW()
     WHERE id = $1
       AND conversation_id = $2
       AND deleted_at IS NULL
     RETURNING id,
               conversation_id,
               type,
               content,
               metadata,
               created_at,
               edited_at,
               deleted_at,
               author_user_id,
               NULL::text AS author_first_name,
               NULL::text AS author_last_name,
               NULL::text AS author_email,
               NULL::text AS author_role`,
    [messageId, conversationId]
  );

  if (!result.rows[0]) throw new Error("NotFound");

  const updatedMessage = result.rows[0];
  const author = updatedMessage.author_user_id
    ? await getUserSummary(db, toNumericId(updatedMessage.author_user_id) ?? 0)
    : null;

  return toConversationMessage(
    {
      ...updatedMessage,
      author_first_name: author?.first_name ?? null,
      author_last_name: author?.last_name ?? null,
      author_email: author?.email ?? null,
      author_role: author?.role ?? null,
    },
    actor.id
  );
}
