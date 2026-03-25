import { and, desc, eq, isNull } from "drizzle-orm";
import { AuthUser } from "@/types/auth";
import { recordAuditEvent } from "@/lib/server/auditLog";
import { db, ensureDatabase, orm } from "@/lib/server/db";
import { logServerEvent } from "@/lib/server/observability";
import { deleteUserAccount } from "@/lib/server/auth";
import {
  accountDeletionRequests,
  dataExportRequests,
  disclosureLogs,
  legalHolds,
} from "@/lib/server/schema";

export type DataExportRequestStatus = "pending" | "completed" | "failed";
export type AccountDeletionRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "completed"
  | "cancelled";
export type LegalHoldTargetType = "user" | "conversation" | "application";

export type DataExportRequestSummary = {
  id: number;
  status: DataExportRequestStatus;
  format: string;
  createdAt: string;
  completedAt: string | null;
  expiresAt: string | null;
  error: string | null;
};

export type AccountDeletionRequestSummary = {
  id: number;
  status: AccountDeletionRequestStatus;
  reason: string | null;
  requestedAt: string;
  reviewedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  reviewNote: string | null;
};

export type LegalHoldSummary = {
  id: number;
  targetType: LegalHoldTargetType;
  targetId: number;
  reason: string;
  createdAt: string;
  releasedAt: string | null;
};

export type AdminAccountDeletionRequestSummary = AccountDeletionRequestSummary & {
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
};

function toIso(value: Date | string | null | undefined) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function normalizeDataExportStatus(status: string): DataExportRequestStatus {
  return status === "completed" || status === "failed" ? status : "pending";
}

function normalizeDeletionStatus(status: string): AccountDeletionRequestStatus {
  return status === "approved" ||
    status === "rejected" ||
    status === "completed" ||
    status === "cancelled"
    ? status
    : "pending";
}

function normalizeLegalHoldTargetType(targetType: string): LegalHoldTargetType {
  return targetType === "conversation" || targetType === "application" ? targetType : "user";
}

function mapDataExportSummary(row: {
  id: number;
  status: string;
  format: string;
  created_at: Date | string;
  completed_at: Date | string | null;
  expires_at: Date | string | null;
  error: string | null;
}): DataExportRequestSummary {
  return {
    id: row.id,
    status: normalizeDataExportStatus(row.status),
    format: row.format,
    createdAt: toIso(row.created_at) ?? new Date().toISOString(),
    completedAt: toIso(row.completed_at),
    expiresAt: toIso(row.expires_at),
    error: row.error,
  };
}

function mapDeletionRequestSummary(row: {
  id: number;
  status: string;
  reason: string | null;
  requested_at: Date | string;
  reviewed_at: Date | string | null;
  completed_at: Date | string | null;
  cancelled_at: Date | string | null;
  review_note: string | null;
}): AccountDeletionRequestSummary {
  return {
    id: row.id,
    status: normalizeDeletionStatus(row.status),
    reason: row.reason,
    requestedAt: toIso(row.requested_at) ?? new Date().toISOString(),
    reviewedAt: toIso(row.reviewed_at),
    completedAt: toIso(row.completed_at),
    cancelledAt: toIso(row.cancelled_at),
    reviewNote: row.review_note,
  };
}

function mapLegalHoldSummary(row: {
  id: number;
  target_type: string;
  target_id: number;
  reason: string;
  created_at: Date | string;
  released_at: Date | string | null;
}): LegalHoldSummary {
  return {
    id: row.id,
    targetType: normalizeLegalHoldTargetType(row.target_type),
    targetId: row.target_id,
    reason: row.reason,
    createdAt: toIso(row.created_at) ?? new Date().toISOString(),
    releasedAt: toIso(row.released_at),
  };
}

export async function listUserDataExportRequests(userId: number) {
  await ensureDatabase();
  if (!orm) throw new Error("Database unavailable");

  const result = await orm
    .select({
      id: dataExportRequests.id,
      status: dataExportRequests.status,
      format: dataExportRequests.format,
      created_at: dataExportRequests.createdAt,
      completed_at: dataExportRequests.completedAt,
      expires_at: dataExportRequests.expiresAt,
      error: dataExportRequests.error,
    })
    .from(dataExportRequests)
    .where(eq(dataExportRequests.userId, userId))
    .orderBy(desc(dataExportRequests.createdAt))
    .limit(10);

  return result.map(mapDataExportSummary);
}

export async function getUserDataExportPayload(userId: number, requestId: number) {
  await ensureDatabase();
  if (!orm) throw new Error("Database unavailable");

  const [row] = await orm
    .select({
      id: dataExportRequests.id,
      status: dataExportRequests.status,
      format: dataExportRequests.format,
      payload: dataExportRequests.payload,
      created_at: dataExportRequests.createdAt,
      completed_at: dataExportRequests.completedAt,
      expires_at: dataExportRequests.expiresAt,
      error: dataExportRequests.error,
    })
    .from(dataExportRequests)
    .where(and(eq(dataExportRequests.id, requestId), eq(dataExportRequests.userId, userId)))
    .limit(1);

  if (!row) {
    return null;
  }

  return {
    summary: mapDataExportSummary(row),
    payload: row.payload,
  };
}

async function buildUserDataExport(userId: number) {
  if (!db) throw new Error("Database unavailable");

  const userResult = await db.query(
    `SELECT id, email, first_name, last_name, role, created_at, last_seen_at, last_coach_action_at
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [userId]
  );
  const user = userResult.rows[0] ?? null;

  const [settings, searchHistory, groups, managedGroups, applications, apiKeys, conversations] =
    await Promise.all([
      db.query(
        `SELECT settings, theme, analytics_consent, locations_cache, updated_at
         FROM user_settings
         WHERE user_id = $1
         LIMIT 1`,
        [userId]
      ),
      db.query(
        `SELECT entry_id, position, entry, created_at
         FROM user_search_history
         WHERE user_id = $1
         ORDER BY position ASC, created_at ASC`,
        [userId]
      ),
      db.query(
        `SELECT g.id, g.name, m.created_at AS joined_at
         FROM coach_group_members m
         INNER JOIN coach_groups g ON g.id = m.group_id
         WHERE m.user_id = $1
         ORDER BY g.name ASC`,
        [userId]
      ),
      db.query(
        `SELECT g.id, g.name, c.created_at AS assigned_at
         FROM coach_group_coaches c
         INNER JOIN coach_groups g ON g.id = c.group_id
         WHERE c.user_id = $1
         ORDER BY g.name ASC`,
        [userId]
      ),
      db.query(
        `SELECT a.*, aj.provider, aj.external_job_id, aj.title, aj.company, aj.location, aj.contract_type,
                aj.url, aj.publication_date, aj.pdf_url, aj.description, aj.raw_payload
         FROM applications a
         LEFT JOIN application_jobs aj ON aj.application_id = a.id
         WHERE a.user_id = $1
         ORDER BY a.updated_at DESC, a.id DESC`,
        [userId]
      ),
      db.query(
        `SELECT id, name, key_prefix, last_four, created_at, expires_at, last_used_at, revoked_at
         FROM api_keys
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId]
      ),
      db.query(
        `SELECT c.id, c.type, c.group_id, c.direct_user_a_id, c.direct_user_b_id, c.created_by_user_id,
                c.created_at, c.last_message_at
         FROM conversation_participants cp
         INNER JOIN conversations c ON c.id = cp.conversation_id
         WHERE cp.user_id = $1
         ORDER BY c.last_message_at DESC`,
        [userId]
      ),
    ]);

  const applicationIds = applications.rows
    .map((row) => Number((row as { id: number }).id))
    .filter((value) => Number.isFinite(value));
  const conversationIds = conversations.rows
    .map((row) => Number((row as { id: number }).id))
    .filter((value) => Number.isFinite(value));

  const [
    privateNotes,
    privateNoteContributors,
    sharedNotes,
    sharedNoteContributors,
    applicationEvents,
    conversationParticipants,
    conversationMessages,
    conversationReads,
  ] = await Promise.all([
    applicationIds.length
      ? db.query(
          `SELECT *
           FROM application_private_notes
           WHERE application_id = ANY($1::bigint[])
           ORDER BY updated_at DESC`,
          [applicationIds]
        )
      : Promise.resolve({ rows: [] }),
    applicationIds.length
      ? db.query(
          `SELECT c.*
           FROM application_private_note_contributors c
           INNER JOIN application_private_notes n ON n.id = c.private_note_id
           WHERE n.application_id = ANY($1::bigint[])
           ORDER BY c.added_at ASC`,
          [applicationIds]
        )
      : Promise.resolve({ rows: [] }),
    applicationIds.length
      ? db.query(
          `SELECT *
           FROM application_shared_notes
           WHERE application_id = ANY($1::bigint[])
           ORDER BY updated_at DESC`,
          [applicationIds]
        )
      : Promise.resolve({ rows: [] }),
    applicationIds.length
      ? db.query(
          `SELECT c.*
           FROM application_shared_note_contributors c
           INNER JOIN application_shared_notes n ON n.id = c.shared_note_id
           WHERE n.application_id = ANY($1::bigint[])
           ORDER BY c.added_at ASC`,
          [applicationIds]
        )
      : Promise.resolve({ rows: [] }),
    applicationIds.length
      ? db.query(
          `SELECT *
           FROM application_events
           WHERE application_id = ANY($1::bigint[])
           ORDER BY created_at DESC`,
          [applicationIds]
        )
      : Promise.resolve({ rows: [] }),
    conversationIds.length
      ? db.query(
          `SELECT *
           FROM conversation_participants
           WHERE conversation_id = ANY($1::bigint[])
           ORDER BY joined_at ASC`,
          [conversationIds]
        )
      : Promise.resolve({ rows: [] }),
    conversationIds.length
      ? db.query(
          `SELECT *
           FROM conversation_messages
           WHERE conversation_id = ANY($1::bigint[])
           ORDER BY created_at ASC, id ASC`,
          [conversationIds]
        )
      : Promise.resolve({ rows: [] }),
    conversationIds.length
      ? db.query(
          `SELECT *
           FROM conversation_reads
           WHERE conversation_id = ANY($1::bigint[])`,
          [conversationIds]
        )
      : Promise.resolve({ rows: [] }),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    user,
    settings: settings.rows[0] ?? null,
    searchHistory: searchHistory.rows,
    groups: groups.rows,
    managedGroups: managedGroups.rows,
    applications: applications.rows,
    applicationPrivateNotes: privateNotes.rows,
    applicationPrivateNoteContributors: privateNoteContributors.rows,
    applicationSharedNotes: sharedNotes.rows,
    applicationSharedNoteContributors: sharedNoteContributors.rows,
    applicationEvents: applicationEvents.rows,
    apiKeys: apiKeys.rows,
    conversations: conversations.rows,
    conversationParticipants: conversationParticipants.rows,
    conversationMessages: conversationMessages.rows,
    conversationReads: conversationReads.rows,
  };
}

export async function createUserDataExport(user: AuthUser) {
  await ensureDatabase();
  if (!orm) throw new Error("Database unavailable");

  const [createdRow] = await orm
    .insert(dataExportRequests)
    .values({
      userId: user.id,
      status: "pending",
      format: "json",
    })
    .returning({
      id: dataExportRequests.id,
      created_at: dataExportRequests.createdAt,
    });

  if (!createdRow) {
    throw new Error("Data export request creation failed");
  }

  try {
    const payload = await buildUserDataExport(user.id);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const [updated] = await orm
      .update(dataExportRequests)
      .set({
        status: "completed",
        payload,
        completedAt: new Date(),
        expiresAt,
      })
      .where(eq(dataExportRequests.id, createdRow.id))
      .returning({
        id: dataExportRequests.id,
        status: dataExportRequests.status,
        format: dataExportRequests.format,
        created_at: dataExportRequests.createdAt,
        completed_at: dataExportRequests.completedAt,
        expires_at: dataExportRequests.expiresAt,
        error: dataExportRequests.error,
      });

    await recordAuditEvent({
      actorUserId: user.id,
      action: "user_data_export_requested",
      targetUserId: user.id,
      payload: {
        exportRequestId: createdRow.id,
        format: "json",
      },
    });

    logServerEvent({
      category: "compliance",
      action: "user_data_export_requested",
      meta: {
        actorUserId: user.id,
        exportRequestId: createdRow.id,
      },
    });

    return mapDataExportSummary(updated);
  } catch (error) {
    await orm
      .update(dataExportRequests)
      .set({
        status: "failed",
        error: error instanceof Error ? error.message : "Export impossible",
      })
      .where(eq(dataExportRequests.id, createdRow.id));
    throw error;
  }
}

export async function listAccountDeletionRequests(userId: number) {
  await ensureDatabase();
  if (!orm) throw new Error("Database unavailable");

  const result = await orm
    .select({
      id: accountDeletionRequests.id,
      status: accountDeletionRequests.status,
      reason: accountDeletionRequests.reason,
      requested_at: accountDeletionRequests.requestedAt,
      reviewed_at: accountDeletionRequests.reviewedAt,
      completed_at: accountDeletionRequests.completedAt,
      cancelled_at: accountDeletionRequests.cancelledAt,
      review_note: accountDeletionRequests.reviewNote,
    })
    .from(accountDeletionRequests)
    .where(eq(accountDeletionRequests.userId, userId))
    .orderBy(desc(accountDeletionRequests.requestedAt))
    .limit(10);

  return result.map(mapDeletionRequestSummary);
}

export async function listAccountDeletionRequestsForAdmin(limit = 50) {
  await ensureDatabase();
  if (!db) throw new Error("Database unavailable");

  const result = await db.query<{
    id: number;
    status: string;
    reason: string | null;
    requested_at: Date | string;
    reviewed_at: Date | string | null;
    completed_at: Date | string | null;
    cancelled_at: Date | string | null;
    review_note: string | null;
    user_id: number;
    user_email: string;
    user_first_name: string;
    user_last_name: string;
    user_role: string;
  }>(
    `SELECT r.id, r.status, r.reason, r.requested_at, r.reviewed_at, r.completed_at,
            r.cancelled_at, r.review_note,
            u.id AS user_id, u.email AS user_email, u.first_name AS user_first_name,
            u.last_name AS user_last_name, u.role AS user_role
     FROM account_deletion_requests r
     INNER JOIN users u ON u.id = r.user_id
     ORDER BY r.requested_at DESC
     LIMIT $1`,
    [limit]
  );

  return result.rows.map((row) => ({
    ...mapDeletionRequestSummary(row),
    user: {
      id: row.user_id,
      email: row.user_email,
      firstName: row.user_first_name,
      lastName: row.user_last_name,
      role: row.user_role,
    },
  }));
}

export async function reviewAccountDeletionRequest(input: {
  requestId: number;
  action: "approve" | "reject" | "complete";
  reviewNote?: string;
  actor: AuthUser;
}) {
  await ensureDatabase();
  if (!orm) throw new Error("Database unavailable");

  const [request] = await orm
    .select({
      id: accountDeletionRequests.id,
      userId: accountDeletionRequests.userId,
      status: accountDeletionRequests.status,
      reason: accountDeletionRequests.reason,
      requestedAt: accountDeletionRequests.requestedAt,
      reviewedAt: accountDeletionRequests.reviewedAt,
      completedAt: accountDeletionRequests.completedAt,
      cancelledAt: accountDeletionRequests.cancelledAt,
      reviewNote: accountDeletionRequests.reviewNote,
    })
    .from(accountDeletionRequests)
    .where(eq(accountDeletionRequests.id, input.requestId))
    .limit(1);

  if (!request) {
    const error = new Error("Demande introuvable.");
    error.name = "DeletionRequestNotFoundError";
    throw error;
  }

  const normalizedStatus = normalizeDeletionStatus(request.status);
  const reviewNote = input.reviewNote?.trim() || null;

  if (input.action === "approve") {
    if (normalizedStatus !== "pending") {
      const error = new Error("Seules les demandes en attente peuvent être approuvées.");
      error.name = "DeletionRequestStatusError";
      throw error;
    }

    const [updated] = await orm
      .update(accountDeletionRequests)
      .set({
        status: "approved",
        reviewedAt: new Date(),
        reviewedByUserId: input.actor.id,
        reviewNote,
      })
      .where(eq(accountDeletionRequests.id, request.id))
      .returning({
        id: accountDeletionRequests.id,
        status: accountDeletionRequests.status,
        reason: accountDeletionRequests.reason,
        requested_at: accountDeletionRequests.requestedAt,
        reviewed_at: accountDeletionRequests.reviewedAt,
        completed_at: accountDeletionRequests.completedAt,
        cancelled_at: accountDeletionRequests.cancelledAt,
        review_note: accountDeletionRequests.reviewNote,
      });

    await recordAuditEvent({
      actorUserId: input.actor.id,
      action: "account_deletion_approved",
      targetUserId: request.userId,
      payload: {
        requestId: request.id,
      },
    });

    return {
      request: mapDeletionRequestSummary(updated),
      deletedUserId: null,
    };
  }

  if (input.action === "reject") {
    if (normalizedStatus !== "pending") {
      const error = new Error("Seules les demandes en attente peuvent être refusées.");
      error.name = "DeletionRequestStatusError";
      throw error;
    }

    const [updated] = await orm
      .update(accountDeletionRequests)
      .set({
        status: "rejected",
        reviewedAt: new Date(),
        reviewedByUserId: input.actor.id,
        reviewNote,
      })
      .where(eq(accountDeletionRequests.id, request.id))
      .returning({
        id: accountDeletionRequests.id,
        status: accountDeletionRequests.status,
        reason: accountDeletionRequests.reason,
        requested_at: accountDeletionRequests.requestedAt,
        reviewed_at: accountDeletionRequests.reviewedAt,
        completed_at: accountDeletionRequests.completedAt,
        cancelled_at: accountDeletionRequests.cancelledAt,
        review_note: accountDeletionRequests.reviewNote,
      });

    await recordAuditEvent({
      actorUserId: input.actor.id,
      action: "account_deletion_rejected",
      targetUserId: request.userId,
      payload: {
        requestId: request.id,
      },
    });

    return {
      request: mapDeletionRequestSummary(updated),
      deletedUserId: null,
    };
  }

  if (normalizedStatus !== "approved") {
    const error = new Error("Seules les demandes approuvées peuvent être finalisées.");
    error.name = "DeletionRequestStatusError";
    throw error;
  }

  await assertNoActiveUserLegalHold(request.userId);

  await orm
    .update(accountDeletionRequests)
    .set({
      status: "completed",
      completedAt: new Date(),
      reviewedAt: new Date(),
      reviewedByUserId: input.actor.id,
      reviewNote,
    })
    .where(eq(accountDeletionRequests.id, request.id));

  await recordAuditEvent({
    actorUserId: input.actor.id,
    action: "account_deletion_completed",
    targetUserId: request.userId,
    payload: {
      requestId: request.id,
    },
  });

  await deleteUserAccount(request.userId);

  return {
    request: null,
    deletedUserId: request.userId,
  };
}

export async function getActiveLegalHold(targetType: LegalHoldTargetType, targetId: number) {
  await ensureDatabase();
  if (!orm) throw new Error("Database unavailable");

  const [row] = await orm
    .select({
      id: legalHolds.id,
      target_type: legalHolds.targetType,
      target_id: legalHolds.targetId,
      reason: legalHolds.reason,
      created_at: legalHolds.createdAt,
      released_at: legalHolds.releasedAt,
    })
    .from(legalHolds)
    .where(
      and(
        eq(legalHolds.targetType, targetType),
        eq(legalHolds.targetId, targetId),
        isNull(legalHolds.releasedAt)
      )
    )
    .orderBy(desc(legalHolds.createdAt))
    .limit(1);

  return row ? mapLegalHoldSummary(row) : null;
}

export async function assertNoActiveUserLegalHold(userId: number) {
  const hold = await getActiveLegalHold("user", userId);
  if (hold) {
    const error = new Error("Compte gelé pour conservation légale. Action impossible.");
    error.name = "ActiveLegalHoldError";
    throw error;
  }
}

export async function createAccountDeletionRequest(user: AuthUser, reason?: string) {
  await assertNoActiveUserLegalHold(user.id);
  await ensureDatabase();
  if (!orm) throw new Error("Database unavailable");

  const [pending] = await orm
    .select({ id: accountDeletionRequests.id })
    .from(accountDeletionRequests)
    .where(
      and(
        eq(accountDeletionRequests.userId, user.id),
        eq(accountDeletionRequests.status, "pending"),
        isNull(accountDeletionRequests.cancelledAt)
      )
    )
    .limit(1);
  if (pending) {
    const error = new Error("Une demande de suppression est déjà en attente.");
    error.name = "DuplicateDeletionRequestError";
    throw error;
  }

  const [created] = await orm
    .insert(accountDeletionRequests)
    .values({
      userId: user.id,
      status: "pending",
      reason: reason?.trim() || null,
    })
    .returning({
      id: accountDeletionRequests.id,
      status: accountDeletionRequests.status,
      reason: accountDeletionRequests.reason,
      requested_at: accountDeletionRequests.requestedAt,
      reviewed_at: accountDeletionRequests.reviewedAt,
      completed_at: accountDeletionRequests.completedAt,
      cancelled_at: accountDeletionRequests.cancelledAt,
      review_note: accountDeletionRequests.reviewNote,
    });

  await recordAuditEvent({
    actorUserId: user.id,
    action: "account_deletion_requested",
    targetUserId: user.id,
    payload: {
      requestId: created?.id,
    },
  });

  logServerEvent({
    category: "compliance",
    action: "account_deletion_requested",
    meta: {
      actorUserId: user.id,
      requestId: created?.id,
    },
  });

  return mapDeletionRequestSummary(created);
}

export async function cancelPendingAccountDeletionRequest(user: AuthUser) {
  await ensureDatabase();
  if (!orm) throw new Error("Database unavailable");

  const [pending] = await orm
    .select({ id: accountDeletionRequests.id })
    .from(accountDeletionRequests)
    .where(
      and(
        eq(accountDeletionRequests.userId, user.id),
        eq(accountDeletionRequests.status, "pending"),
        isNull(accountDeletionRequests.cancelledAt)
      )
    )
    .orderBy(desc(accountDeletionRequests.requestedAt))
    .limit(1);

  if (!pending) {
    return null;
  }

  const [row] = await orm
    .update(accountDeletionRequests)
    .set({
      status: "cancelled",
      cancelledAt: new Date(),
    })
    .where(eq(accountDeletionRequests.id, pending.id))
    .returning({
      id: accountDeletionRequests.id,
      status: accountDeletionRequests.status,
      reason: accountDeletionRequests.reason,
      requested_at: accountDeletionRequests.requestedAt,
      reviewed_at: accountDeletionRequests.reviewedAt,
      completed_at: accountDeletionRequests.completedAt,
      cancelled_at: accountDeletionRequests.cancelledAt,
      review_note: accountDeletionRequests.reviewNote,
    });

  if (!row) {
    return null;
  }

  await recordAuditEvent({
    actorUserId: user.id,
    action: "account_deletion_cancelled",
    targetUserId: user.id,
    payload: {
      requestId: row.id,
    },
  });

  logServerEvent({
    category: "compliance",
    action: "account_deletion_cancelled",
    meta: {
      actorUserId: user.id,
      requestId: row.id,
    },
  });

  return mapDeletionRequestSummary(row);
}

export async function createLegalHold(input: {
  actorUserId: number;
  targetType: LegalHoldTargetType;
  targetId: number;
  reason: string;
}) {
  await ensureDatabase();
  if (!orm) throw new Error("Database unavailable");

  const existing = await getActiveLegalHold(input.targetType, input.targetId);
  if (existing) {
    return existing;
  }

  const [created] = await orm
    .insert(legalHolds)
    .values({
      targetType: input.targetType,
      targetId: input.targetId,
      reason: input.reason.trim(),
      createdByUserId: input.actorUserId,
    })
    .returning({
      id: legalHolds.id,
      target_type: legalHolds.targetType,
      target_id: legalHolds.targetId,
      reason: legalHolds.reason,
      created_at: legalHolds.createdAt,
      released_at: legalHolds.releasedAt,
    });

  await recordAuditEvent({
    actorUserId: input.actorUserId,
    action: "legal_hold_created",
    targetUserId: input.targetType === "user" ? input.targetId : null,
    payload: {
      legalHoldId: created?.id,
      targetType: input.targetType,
      targetId: input.targetId,
    },
  });

  return mapLegalHoldSummary(created);
}

export async function releaseLegalHold(id: number, actorUserId: number) {
  await ensureDatabase();
  if (!orm) throw new Error("Database unavailable");

  const [row] = await orm
    .update(legalHolds)
    .set({ releasedAt: new Date() })
    .where(and(eq(legalHolds.id, id), isNull(legalHolds.releasedAt)))
    .returning({
      id: legalHolds.id,
      target_type: legalHolds.targetType,
      target_id: legalHolds.targetId,
      reason: legalHolds.reason,
      created_at: legalHolds.createdAt,
      released_at: legalHolds.releasedAt,
    });

  if (!row) {
    return null;
  }

  await recordAuditEvent({
    actorUserId,
    action: "legal_hold_released",
    targetUserId: row.target_type === "user" ? row.target_id : null,
    payload: {
      legalHoldId: row.id,
      targetType: row.target_type,
      targetId: row.target_id,
    },
  });

  return mapLegalHoldSummary(row);
}

export async function listActiveLegalHolds(limit = 50) {
  await ensureDatabase();
  if (!orm) throw new Error("Database unavailable");

  const result = await orm
    .select({
      id: legalHolds.id,
      target_type: legalHolds.targetType,
      target_id: legalHolds.targetId,
      reason: legalHolds.reason,
      created_at: legalHolds.createdAt,
      released_at: legalHolds.releasedAt,
    })
    .from(legalHolds)
    .where(isNull(legalHolds.releasedAt))
    .orderBy(desc(legalHolds.createdAt))
    .limit(limit);

  return result.map(mapLegalHoldSummary);
}

export async function createDisclosureLog(input: {
  actorUserId: number;
  requestType: "authority_request" | "litigation" | "other";
  authorityName: string;
  legalBasis?: string;
  targetType: "user" | "conversation" | "application" | "export" | "other";
  targetId?: number;
  scopeSummary: string;
  exportReference?: string;
}) {
  await ensureDatabase();
  if (!orm) throw new Error("Database unavailable");

  const [created] = await orm
    .insert(disclosureLogs)
    .values({
      requestType: input.requestType,
      authorityName: input.authorityName.trim(),
      legalBasis: input.legalBasis?.trim() || null,
      targetType: input.targetType,
      targetId: input.targetId ?? null,
      scopeSummary: input.scopeSummary.trim(),
      exportReference: input.exportReference?.trim() || null,
      createdByUserId: input.actorUserId,
    })
    .returning({
      id: disclosureLogs.id,
      created_at: disclosureLogs.createdAt,
    });

  await recordAuditEvent({
    actorUserId: input.actorUserId,
    action: "disclosure_logged",
    targetUserId: input.targetType === "user" ? input.targetId ?? null : null,
    payload: {
      disclosureLogId: created?.id,
      requestType: input.requestType,
      targetType: input.targetType,
      targetId: input.targetId ?? null,
    },
  });

  return {
    id: created?.id ?? 0,
    createdAt: toIso(created?.created_at) ?? new Date().toISOString(),
  };
}

export async function listDisclosureLogs(limit = 50) {
  await ensureDatabase();
  if (!orm) throw new Error("Database unavailable");

  const result = await orm
    .select({
      id: disclosureLogs.id,
      request_type: disclosureLogs.requestType,
      authority_name: disclosureLogs.authorityName,
      legal_basis: disclosureLogs.legalBasis,
      target_type: disclosureLogs.targetType,
      target_id: disclosureLogs.targetId,
      scope_summary: disclosureLogs.scopeSummary,
      export_reference: disclosureLogs.exportReference,
      created_by_user_id: disclosureLogs.createdByUserId,
      created_at: disclosureLogs.createdAt,
    })
    .from(disclosureLogs)
    .orderBy(desc(disclosureLogs.createdAt))
    .limit(limit);

  return result.map((row) => ({
    id: row.id,
    requestType: row.request_type,
    authorityName: row.authority_name,
    legalBasis: row.legal_basis,
    targetType: row.target_type,
    targetId: row.target_id,
    scopeSummary: row.scope_summary,
    exportReference: row.export_reference,
    createdByUserId: row.created_by_user_id,
    createdAt: toIso(row.created_at) ?? new Date().toISOString(),
  }));
}
