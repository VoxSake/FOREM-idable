import { db, ensureDatabase } from "@/lib/server/db";

export interface PersistedUserState {
  values: Record<string, string>;
  updatedAt: string;
}

function sanitizeValues(input: unknown) {
  const values: Record<string, string> = {};

  if (!input || typeof input !== "object") {
    return values;
  }

  for (const [key, value] of Object.entries(input)) {
    if (typeof value === "string") {
      values[key] = value;
    }
  }

  return values;
}

export async function getUserState(userId: number): Promise<PersistedUserState | null> {
  await ensureDatabase();
  if (!db) throw new Error("Database unavailable");

  const result = await db.query<{
    payload: Record<string, string>;
    updated_at: string;
  }>(
    `SELECT payload, updated_at
     FROM user_state
     WHERE user_id = $1`,
    [userId]
  );

  const row = result.rows[0];
  if (!row) return null;

  return {
    values: sanitizeValues(row.payload),
    updatedAt: row.updated_at,
  };
}

export async function saveUserState(userId: number, values: unknown) {
  await ensureDatabase();
  if (!db) throw new Error("Database unavailable");

  const sanitized = sanitizeValues(values);

  const result = await db.query<{
    payload: Record<string, string>;
    updated_at: string;
  }>(
    `INSERT INTO user_state (user_id, payload, updated_at)
     VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (user_id)
     DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()
     RETURNING payload, updated_at`,
    [userId, JSON.stringify(sanitized)]
  );

  return {
    values: sanitizeValues(result.rows[0].payload),
    updatedAt: result.rows[0].updated_at,
  };
}
