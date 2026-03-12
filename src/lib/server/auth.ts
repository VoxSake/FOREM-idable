import { randomBytes, scryptSync, timingSafeEqual, createHash } from "crypto";
import { cookies } from "next/headers";
import { db, ensureDatabase } from "@/lib/server/db";

const SESSION_COOKIE = "forem_idable_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30;

export interface AuthUser {
  id: number;
  email: string;
}

function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

function verifyPassword(password: string, storedHash: string) {
  const [salt, expectedHash] = storedHash.split(":");
  if (!salt || !expectedHash) return false;

  const passwordHash = scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHash, "hex");

  return expected.length === passwordHash.length && timingSafeEqual(passwordHash, expected);
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function createUser(email: string, password: string) {
  await ensureDatabase();
  if (!db) throw new Error("Database unavailable");

  const normalizedEmail = normalizeEmail(email);
  const passwordHash = hashPassword(password);

  const result = await db.query<AuthUser>(
    `INSERT INTO users (email, password_hash)
     VALUES ($1, $2)
     RETURNING id, email`,
    [normalizedEmail, passwordHash]
  );

  return result.rows[0];
}

export async function authenticateUser(email: string, password: string) {
  await ensureDatabase();
  if (!db) throw new Error("Database unavailable");

  const normalizedEmail = normalizeEmail(email);
  const result = await db.query<{
    id: number;
    email: string;
    password_hash: string;
  }>(
    `SELECT id, email, password_hash
     FROM users
     WHERE email = $1`,
    [normalizedEmail]
  );

  const user = result.rows[0];
  if (!user || !verifyPassword(password, user.password_hash)) {
    return null;
  }

  return { id: user.id, email: user.email };
}

export async function createSession(userId: number) {
  await ensureDatabase();
  if (!db) throw new Error("Database unavailable");

  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await db.query(
    `INSERT INTO sessions (token_hash, user_id, expires_at)
     VALUES ($1, $2, $3)`,
    [tokenHash, userId, expiresAt.toISOString()]
  );

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token && db) {
    await ensureDatabase();
    await db.query("DELETE FROM sessions WHERE token_hash = $1", [hashToken(token)]);
  }

  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  if (!db) return null;

  await ensureDatabase();

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const result = await db.query<AuthUser>(
    `SELECT users.id, users.email
     FROM sessions
     INNER JOIN users ON users.id = sessions.user_id
     WHERE sessions.token_hash = $1
       AND sessions.expires_at > NOW()
     LIMIT 1`,
    [hashToken(token)]
  );

  return result.rows[0] ?? null;
}
