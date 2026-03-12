import { createHash, randomBytes } from "crypto";
import { headers } from "next/headers";
import { db, ensureDatabase } from "@/lib/server/db";
import { ApiKeyCreateResult, ApiKeySummary, ExternalApiActor } from "@/types/externalApi";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function buildKeyMaterial() {
  const raw = randomBytes(24).toString("base64url");
  const keyPrefix = `frm_live_${raw.slice(0, 8)}`;
  const plainTextKey = `${keyPrefix}_${raw}`;
  return {
    plainTextKey,
    keyPrefix,
    lastFour: plainTextKey.slice(-4),
    tokenHash: hashToken(plainTextKey),
  };
}

export async function listApiKeysForUser(userId: number): Promise<ApiKeySummary[]> {
  await ensureDatabase();
  if (!db) throw new Error("Database unavailable");

  const result = await db.query<ApiKeySummary>(
    `SELECT id,
            name,
            key_prefix AS "keyPrefix",
            last_four AS "lastFour",
            created_at AS "createdAt",
            last_used_at AS "lastUsedAt",
            revoked_at AS "revokedAt"
     FROM api_keys
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );

  return result.rows;
}

export async function createApiKey(userId: number, name: string): Promise<ApiKeyCreateResult> {
  await ensureDatabase();
  if (!db) throw new Error("Database unavailable");

  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error("API key name required");
  }

  const { plainTextKey, keyPrefix, lastFour, tokenHash } = buildKeyMaterial();
  const result = await db.query<ApiKeySummary>(
    `INSERT INTO api_keys (user_id, name, token_hash, key_prefix, last_four)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id,
               name,
               key_prefix AS "keyPrefix",
               last_four AS "lastFour",
               created_at AS "createdAt",
               last_used_at AS "lastUsedAt",
               revoked_at AS "revokedAt"`,
    [userId, trimmedName, tokenHash, keyPrefix, lastFour]
  );

  return {
    apiKey: result.rows[0],
    plainTextKey,
  };
}

export async function revokeApiKey(userId: number, apiKeyId: number) {
  await ensureDatabase();
  if (!db) throw new Error("Database unavailable");

  await db.query(
    `UPDATE api_keys
     SET revoked_at = NOW()
     WHERE id = $1
       AND user_id = $2
       AND revoked_at IS NULL`,
    [apiKeyId, userId]
  );
}

async function getBearerToken() {
  const headerStore = await headers();
  const authorization = headerStore.get("authorization") || "";
  const [scheme, token] = authorization.split(" ");
  if (!scheme || scheme.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token.trim();
}

export async function requireExternalApiActor(): Promise<ExternalApiActor | null> {
  await ensureDatabase();
  if (!db) throw new Error("Database unavailable");

  const token = await getBearerToken();
  if (!token) return null;

  const tokenHash = hashToken(token);
  const result = await db.query<{
    id: number;
    user_id: number;
    email: string;
    first_name: string;
    last_name: string;
    role: "coach" | "admin" | "user";
  }>(
    `SELECT api_keys.id,
            api_keys.user_id,
            users.email,
            users.first_name,
            users.last_name,
            users.role
     FROM api_keys
     INNER JOIN users ON users.id = api_keys.user_id
     WHERE api_keys.revoked_at IS NULL
       AND api_keys.token_hash = $1
       AND users.role IN ('coach', 'admin')`
    ,
    [tokenHash]
  );

  const row = result.rows[0];
  if (!row || row.role === "user") {
    return null;
  }

  await db.query(
    `UPDATE api_keys
     SET last_used_at = NOW()
     WHERE id = $1`,
    [row.id]
  );

  return {
    id: row.user_id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    role: row.role,
  };
}
