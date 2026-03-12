import { Pool } from "pg";

declare global {
  var __foremIdablePool: Pool | undefined;
  var __foremIdableSchemaPromise: Promise<void> | undefined;
}

const connectionString = process.env.DATABASE_URL?.trim() || "";

function createPool() {
  if (!connectionString) return null;

  return new Pool({
    connectionString,
    ssl: connectionString.includes("sslmode=require")
      ? { rejectUnauthorized: false }
      : undefined,
  });
}

export const db = globalThis.__foremIdablePool ?? createPool();

if (db && !globalThis.__foremIdablePool) {
  globalThis.__foremIdablePool = db;
}

const schemaSql = `
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS user_state (
  user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_favorites (
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  job JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, job_id)
);

CREATE INDEX IF NOT EXISTS user_favorites_user_position_idx
  ON user_favorites(user_id, position);

CREATE TABLE IF NOT EXISTS user_applications (
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  application JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, job_id)
);

CREATE INDEX IF NOT EXISTS user_applications_user_position_idx
  ON user_applications(user_id, position);

CREATE TABLE IF NOT EXISTS user_search_history (
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entry_id TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  entry JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, entry_id)
);

CREATE INDEX IF NOT EXISTS user_search_history_user_position_idx
  ON user_search_history(user_id, position);

CREATE TABLE IF NOT EXISTS user_settings (
  user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  theme TEXT,
  analytics_consent TEXT,
  locations_cache JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coach_groups (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_by BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS coach_groups_created_by_idx ON coach_groups(created_by);

CREATE TABLE IF NOT EXISTS coach_group_members (
  group_id BIGINT NOT NULL REFERENCES coach_groups(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS coach_group_members_user_id_idx
  ON coach_group_members(user_id);

UPDATE users
SET role = 'admin'
WHERE lower(email) = lower('jordi@brisbois.dev');
`;

export async function ensureDatabase() {
  if (!db) {
    throw new Error("DATABASE_URL is not configured");
  }

  if (!globalThis.__foremIdableSchemaPromise) {
    globalThis.__foremIdableSchemaPromise = db.query(schemaSql).then(() => undefined);
  }

  await globalThis.__foremIdableSchemaPromise;
}
