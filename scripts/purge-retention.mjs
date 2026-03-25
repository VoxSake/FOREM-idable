import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL?.trim() || "";

if (!connectionString) {
  console.error("DATABASE_URL is not configured.");
  process.exit(1);
}

const pool = new Pool({ connectionString });

function days(raw, fallback) {
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

const passwordResetRetentionDays = days(process.env.PASSWORD_RESET_RETENTION_DAYS, 7);
const searchHistoryRetentionDays = days(process.env.SEARCH_HISTORY_RETENTION_DAYS, 365);
const dataExportRetentionDays = days(process.env.DATA_EXPORT_RETENTION_DAYS, 7);

async function deleteCount(query, params = []) {
  const result = await pool.query(query, params);
  return result.rowCount ?? 0;
}

async function main() {
  const summary = {
    expiredSessions: 0,
    stalePasswordResetTokens: 0,
    staleSearchHistory: 0,
    expiredDataExports: 0,
  };

  summary.expiredSessions = await deleteCount(
    `DELETE FROM sessions
     WHERE expires_at < NOW()`
  );

  summary.stalePasswordResetTokens = await deleteCount(
    `DELETE FROM password_reset_tokens
     WHERE expires_at < NOW() - ($1::text || ' days')::interval
        OR (used_at IS NOT NULL AND used_at < NOW() - ($1::text || ' days')::interval)`,
    [String(passwordResetRetentionDays)]
  );

  summary.staleSearchHistory = await deleteCount(
    `DELETE FROM user_search_history
     WHERE created_at < NOW() - ($1::text || ' days')::interval`,
    [String(searchHistoryRetentionDays)]
  );

  summary.expiredDataExports = await deleteCount(
    `DELETE FROM data_export_requests
     WHERE COALESCE(expires_at, created_at + ($1::text || ' days')::interval)
           < NOW()`,
    [String(dataExportRetentionDays)]
  );

  console.log(JSON.stringify({
    ts: new Date().toISOString(),
    category: "maintenance",
    action: "purge_retention",
    summary,
  }));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
