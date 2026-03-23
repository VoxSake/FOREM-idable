import { sql } from "drizzle-orm";
import {
  boolean,
  bigint,
  bigserial,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { UserRole } from "@/types/auth";

export const users = pgTable("users", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  firstName: text("first_name").notNull().default(""),
  lastName: text("last_name").notNull().default(""),
  role: text("role").$type<UserRole>().notNull().default("user"),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
  lastCoachActionAt: timestamp("last_coach_action_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable(
  "sessions",
  {
    tokenHash: text("token_hash").primaryKey(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("sessions_user_id_idx").on(table.userId),
    expiresAtIdx: index("sessions_expires_at_idx").on(table.expiresAt),
  })
);

export const userState = pgTable("user_state", {
  userId: bigint("user_id", { mode: "number" })
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  payload: jsonb("payload").notNull().default(sql`'{}'::jsonb`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userFavorites = pgTable(
  "user_favorites",
  {
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    jobId: text("job_id").notNull(),
    position: integer("position").notNull().default(0),
    job: jsonb("job").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.jobId] }),
    userPositionIdx: index("user_favorites_user_position_idx").on(table.userId, table.position),
  })
);

export const userApplications = pgTable(
  "user_applications",
  {
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    jobId: text("job_id").notNull(),
    position: integer("position").notNull().default(0),
    application: jsonb("application").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.jobId] }),
    userPositionIdx: index("user_applications_user_position_idx").on(table.userId, table.position),
  })
);

export const applications = pgTable(
  "applications",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    jobId: text("job_id").notNull(),
    position: integer("position").notNull().default(0),
    status: text("status").notNull(),
    appliedAt: timestamp("applied_at", { withTimezone: true }).notNull(),
    followUpDueAt: timestamp("follow_up_due_at", { withTimezone: true }),
    followUpEnabled: boolean("follow_up_enabled").notNull().default(true),
    lastFollowUpAt: timestamp("last_follow_up_at", { withTimezone: true }),
    interviewAt: timestamp("interview_at", { withTimezone: true }),
    interviewDetails: text("interview_details"),
    beneficiaryNotes: text("beneficiary_notes"),
    proofs: text("proofs"),
    sourceType: text("source_type").notNull().default("tracked"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (table) => ({
    userJobIdx: index("applications_user_job_idx").on(table.userId, table.jobId),
    userStatusIdx: index("applications_user_status_idx").on(table.userId, table.status),
    userPositionIdx: index("applications_user_position_idx").on(table.userId, table.position),
    followUpDueIdx: index("applications_follow_up_due_idx").on(table.followUpDueAt),
    updatedAtIdx: index("applications_updated_at_idx").on(table.updatedAt),
    userJobUnique: uniqueIndex("applications_user_job_unique").on(table.userId, table.jobId),
  })
);

export const applicationJobs = pgTable(
  "application_jobs",
  {
    applicationId: bigint("application_id", { mode: "number" })
      .primaryKey()
      .references(() => applications.id, { onDelete: "cascade" }),
    provider: text("provider"),
    externalJobId: text("external_job_id"),
    title: text("title").notNull(),
    company: text("company"),
    location: text("location"),
    contractType: text("contract_type"),
    url: text("url"),
    publicationDate: timestamp("publication_date", { withTimezone: true }),
    pdfUrl: text("pdf_url"),
    description: text("description"),
    rawPayload: jsonb("raw_payload"),
  },
  (table) => ({
    providerExternalJobIdx: index("application_jobs_provider_external_job_idx").on(
      table.provider,
      table.externalJobId
    ),
    companyIdx: index("application_jobs_company_idx").on(table.company),
    titleIdx: index("application_jobs_title_idx").on(table.title),
  })
);

export const applicationPrivateNotes = pgTable(
  "application_private_notes",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    applicationId: bigint("application_id", { mode: "number" })
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    createdByUserId: bigint("created_by_user_id", { mode: "number" }).references(() => users.id, {
      onDelete: "set null",
    }),
    createdByFirstName: text("created_by_first_name").notNull().default(""),
    createdByLastName: text("created_by_last_name").notNull().default(""),
    createdByEmail: text("created_by_email").notNull().default(""),
    createdByRole: text("created_by_role").notNull().default("system"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    isLegacy: boolean("is_legacy").notNull().default(false),
  },
  (table) => ({
    applicationIdx: index("application_private_notes_application_idx").on(table.applicationId),
    applicationUnique: uniqueIndex("application_private_notes_application_unique").on(
      table.applicationId
    ),
  })
);

export const applicationPrivateNoteContributors = pgTable(
  "application_private_note_contributors",
  {
    privateNoteId: bigint("private_note_id", { mode: "number" })
      .notNull()
      .references(() => applicationPrivateNotes.id, { onDelete: "cascade" }),
    userId: bigint("user_id", { mode: "number" }).references(() => users.id, {
      onDelete: "set null",
    }),
    firstName: text("first_name").notNull().default(""),
    lastName: text("last_name").notNull().default(""),
    displayName: text("display_name").notNull(),
    email: text("email"),
    role: text("role").notNull(),
    addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.privateNoteId, table.displayName, table.role] }),
    userIdIdx: index("application_private_note_contributors_user_id_idx").on(table.userId),
  })
);

export const applicationSharedNotes = pgTable(
  "application_shared_notes",
  {
    id: text("id").primaryKey(),
    applicationId: bigint("application_id", { mode: "number" })
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    createdByUserId: bigint("created_by_user_id", { mode: "number" }).references(() => users.id, {
      onDelete: "set null",
    }),
    createdByFirstName: text("created_by_first_name").notNull().default(""),
    createdByLastName: text("created_by_last_name").notNull().default(""),
    createdByEmail: text("created_by_email").notNull().default(""),
    createdByRole: text("created_by_role").notNull().default("system"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    isLegacy: boolean("is_legacy").notNull().default(false),
    visibility: text("visibility").notNull().default("coach_shared"),
  },
  (table) => ({
    applicationUpdatedIdx: index("application_shared_notes_application_updated_idx").on(
      table.applicationId,
      table.updatedAt
    ),
  })
);

export const applicationSharedNoteContributors = pgTable(
  "application_shared_note_contributors",
  {
    sharedNoteId: text("shared_note_id")
      .notNull()
      .references(() => applicationSharedNotes.id, { onDelete: "cascade" }),
    userId: bigint("user_id", { mode: "number" }).references(() => users.id, {
      onDelete: "set null",
    }),
    firstName: text("first_name").notNull().default(""),
    lastName: text("last_name").notNull().default(""),
    displayName: text("display_name").notNull(),
    email: text("email"),
    role: text("role").notNull(),
    addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.sharedNoteId, table.displayName, table.role] }),
    userIdIdx: index("application_shared_note_contributors_user_id_idx").on(table.userId),
  })
);

export const applicationEvents = pgTable(
  "application_events",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    applicationId: bigint("application_id", { mode: "number" })
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    actorUserId: bigint("actor_user_id", { mode: "number" }).references(() => users.id, {
      onDelete: "set null",
    }),
    eventType: text("event_type").notNull(),
    payload: jsonb("payload").notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    applicationCreatedIdx: index("application_events_application_created_idx").on(
      table.applicationId,
      table.createdAt
    ),
    eventTypeCreatedIdx: index("application_events_event_type_created_idx").on(
      table.eventType,
      table.createdAt
    ),
  })
);

export const userSearchHistory = pgTable(
  "user_search_history",
  {
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    entryId: text("entry_id").notNull(),
    position: integer("position").notNull().default(0),
    entry: jsonb("entry").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.entryId] }),
    userPositionIdx: index("user_search_history_user_position_idx").on(table.userId, table.position),
  })
);

export const userSettings = pgTable("user_settings", {
  userId: bigint("user_id", { mode: "number" })
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  settings: jsonb("settings").notNull().default(sql`'{}'::jsonb`),
  theme: text("theme"),
  analyticsConsent: text("analytics_consent"),
  locationsCache: jsonb("locations_cache"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const coachGroups = pgTable(
  "coach_groups",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    name: text("name").notNull(),
    createdBy: bigint("created_by", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    managerCoachUserId: bigint("manager_coach_user_id", { mode: "number" }).references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    createdByIdx: index("coach_groups_created_by_idx").on(table.createdBy),
    managerCoachUserIdIdx: index("coach_groups_manager_coach_user_id_idx").on(table.managerCoachUserId),
  })
);

export const coachGroupMembers = pgTable(
  "coach_group_members",
  {
    groupId: bigint("group_id", { mode: "number" })
      .notNull()
      .references(() => coachGroups.id, { onDelete: "cascade" }),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.groupId, table.userId] }),
    userIdIdx: index("coach_group_members_user_id_idx").on(table.userId),
  })
);

export const coachGroupCoaches = pgTable(
  "coach_group_coaches",
  {
    groupId: bigint("group_id", { mode: "number" })
      .notNull()
      .references(() => coachGroups.id, { onDelete: "cascade" }),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.groupId, table.userId] }),
    userIdIdx: index("coach_group_coaches_user_id_idx").on(table.userId),
  })
);

export const apiKeys = pgTable(
  "api_keys",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    keyPrefix: text("key_prefix").notNull(),
    lastFour: text("last_four").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (table) => ({
    userIdIdx: index("api_keys_user_id_idx").on(table.userId),
    activeIdx: index("api_keys_active_idx").on(table.userId, table.revokedAt),
  })
);

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    tokenHash: text("token_hash").primaryKey(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("password_reset_tokens_user_id_idx").on(table.userId),
    expiresAtIdx: index("password_reset_tokens_expires_at_idx").on(table.expiresAt),
  })
);

export const calendarSubscriptions = pgTable(
  "calendar_subscriptions",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    scope: text("scope").notNull().default("group"),
    groupId: bigint("group_id", { mode: "number" }).references(() => coachGroups.id, {
      onDelete: "cascade",
    }),
    tokenHash: text("token_hash").notNull().unique(),
    keyPrefix: text("key_prefix").notNull().default(""),
    lastFour: text("last_four").notNull().default(""),
    createdBy: bigint("created_by", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (table) => ({
    scopeGroupIdx: index("calendar_subscriptions_scope_group_idx").on(
      table.scope,
      table.groupId,
      table.revokedAt
    ),
    createdByIdx: index("calendar_subscriptions_created_by_idx").on(table.createdBy),
  })
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    actorUserId: bigint("actor_user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    targetUserId: bigint("target_user_id", { mode: "number" }).references(() => users.id, {
      onDelete: "set null",
    }),
    groupId: bigint("group_id", { mode: "number" }).references(() => coachGroups.id, {
      onDelete: "set null",
    }),
    payload: jsonb("payload").notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    actorUserIdIdx: index("audit_logs_actor_user_id_idx").on(table.actorUserId),
    targetUserIdIdx: index("audit_logs_target_user_id_idx").on(table.targetUserId),
    groupIdIdx: index("audit_logs_group_id_idx").on(table.groupId),
    actionIdx: index("audit_logs_action_idx").on(table.action, table.createdAt),
  })
);
