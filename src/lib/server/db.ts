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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
