import { Pool } from "pg";
import { runDatabaseMigrations } from "@/lib/server/migrations";

declare global {
  var __foremIdablePool: Pool | undefined;
  var __foremIdableMigrationPromise: Promise<void> | undefined;
}

const connectionString = process.env.DATABASE_URL?.trim() || "";

function getSslConfig() {
  const sslMode = process.env.DB_SSL_MODE?.trim().toLowerCase() ?? "disable";
  if (sslMode === "disable" || !sslMode) {
    return undefined;
  }

  const caFromBase64 = process.env.DB_SSL_CA_BASE64?.trim();
  const caFromPem = process.env.DB_SSL_CA_PEM?.trim();
  const ca = caFromBase64
    ? Buffer.from(caFromBase64, "base64").toString("utf8")
    : caFromPem || undefined;

  return {
    rejectUnauthorized: true,
    ca,
  };
}

function createPool() {
  if (!connectionString) return null;

  return new Pool({
    connectionString,
    // Production runs on the private Coolify Docker network by default,
    // so SSL is disabled unless explicitly requested for an external database.
    ssl: getSslConfig(),
  });
}

export const db = globalThis.__foremIdablePool ?? createPool();

if (db && !globalThis.__foremIdablePool) {
  globalThis.__foremIdablePool = db;
}

export async function ensureDatabase() {
  if (!db) {
    throw new Error("DATABASE_URL is not configured");
  }

  if (!globalThis.__foremIdableMigrationPromise) {
    globalThis.__foremIdableMigrationPromise = runDatabaseMigrations(db);
  }

  await globalThis.__foremIdableMigrationPromise;
}
