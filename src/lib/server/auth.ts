import { randomBytes, scryptSync, timingSafeEqual, createHash } from "crypto";
import { cookies } from "next/headers";
import { db, ensureDatabase } from "@/lib/server/db";
import { AuthUser } from "@/types/auth";

const SESSION_COOKIE = "forem_idable_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30;
const PASSWORD_RESET_DURATION_MS = 1000 * 60 * 60;

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

function normalizeProfileValue(value: string) {
  return value.trim();
}

export async function createUser(
  email: string,
  password: string,
  firstName: string,
  lastName: string
) {
  await ensureDatabase();
  if (!db) throw new Error("Database unavailable");

  const normalizedEmail = normalizeEmail(email);
  const passwordHash = hashPassword(password);
  const normalizedFirstName = normalizeProfileValue(firstName);
  const normalizedLastName = normalizeProfileValue(lastName);
  await db.query("BEGIN");

  try {
    // Serialize first-user bootstrap so only one account can become admin.
    await db.query("SELECT pg_advisory_xact_lock($1)", [4_016_001]);

    const existingUsers = await db.query<{ count: string }>("SELECT COUNT(*)::text AS count FROM users");
    const nextRole: AuthUser["role"] = existingUsers.rows[0]?.count === "0" ? "admin" : "user";

    const result = await db.query<AuthUser>(
      `INSERT INTO users (email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, first_name AS "firstName", last_name AS "lastName", role`,
      [normalizedEmail, passwordHash, normalizedFirstName, normalizedLastName, nextRole]
    );

    await db.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  }
}

export async function authenticateUser(email: string, password: string) {
  await ensureDatabase();
  if (!db) throw new Error("Database unavailable");

  const normalizedEmail = normalizeEmail(email);
  const result = await db.query<{
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    role: AuthUser["role"];
    password_hash: string;
  }>(
    `SELECT id, email, first_name, last_name, role, password_hash
     FROM users
     WHERE email = $1`,
    [normalizedEmail]
  );

  const user = result.rows[0];
  if (!user || !verifyPassword(password, user.password_hash)) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    role: user.role,
  };
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

  await db.query(
    `UPDATE users
     SET last_seen_at = NOW()
     WHERE id = $1`,
    [userId]
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
    `SELECT users.id,
            users.email,
            users.first_name AS "firstName",
            users.last_name AS "lastName",
            users.role
     FROM sessions
     INNER JOIN users ON users.id = sessions.user_id
     WHERE sessions.token_hash = $1
       AND sessions.expires_at > NOW()
     LIMIT 1`,
    [hashToken(token)]
  );

  const user = result.rows[0] ?? null;
  if (user) {
    await db.query(
      `UPDATE users
       SET last_seen_at = NOW()
       WHERE id = $1`,
      [user.id]
    );
  }

  return user;
}

export async function setUserPassword(userId: number, password: string) {
  await ensureDatabase();
  if (!db) throw new Error("Database unavailable");

  const passwordHash = hashPassword(password);
  await db.query(
    `UPDATE users
     SET password_hash = $2
     WHERE id = $1`,
    [userId, passwordHash]
  );
}

export async function createPasswordResetToken(email: string) {
  await ensureDatabase();
  if (!db) throw new Error("Database unavailable");

  const normalizedEmail = normalizeEmail(email);
  const userResult = await db.query<{
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  }>(
    `SELECT id, email, first_name, last_name
     FROM users
     WHERE email = $1
     LIMIT 1`,
    [normalizedEmail]
  );

  const user = userResult.rows[0];
  if (!user) return null;

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_DURATION_MS).toISOString();

  await db.query(
    `DELETE FROM password_reset_tokens
     WHERE user_id = $1 OR expires_at <= NOW() OR used_at IS NOT NULL`,
    [user.id]
  );

  await db.query(
    `INSERT INTO password_reset_tokens (token_hash, user_id, expires_at)
     VALUES ($1, $2, $3)`,
    [hashToken(token), user.id, expiresAt]
  );

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
    },
    expiresAt,
  };
}

export async function resetPasswordWithToken(token: string, password: string) {
  await ensureDatabase();
  if (!db) throw new Error("Database unavailable");

  const tokenHash = hashToken(token);
  const passwordHash = hashPassword(password);

  await db.query("BEGIN");

  try {
    const result = await db.query<{ user_id: number }>(
      `SELECT user_id
       FROM password_reset_tokens
       WHERE token_hash = $1
         AND used_at IS NULL
         AND expires_at > NOW()
       LIMIT 1
       FOR UPDATE`,
      [tokenHash]
    );

    const row = result.rows[0];
    if (!row) {
      await db.query("ROLLBACK");
      return false;
    }

    await db.query(
      `UPDATE users
       SET password_hash = $2
       WHERE id = $1`,
      [row.user_id, passwordHash]
    );

    await db.query(
      `UPDATE password_reset_tokens
       SET used_at = NOW()
       WHERE token_hash = $1`,
      [tokenHash]
    );

    await db.query(`DELETE FROM sessions WHERE user_id = $1`, [row.user_id]);
    await db.query("COMMIT");
    return true;
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  }
}

export async function updateUserProfile(userId: number, firstName: string, lastName: string) {
  await ensureDatabase();
  if (!db) throw new Error("Database unavailable");

  await db.query(
    `UPDATE users
     SET first_name = $2,
         last_name = $3
     WHERE id = $1`,
    [userId, normalizeProfileValue(firstName), normalizeProfileValue(lastName)]
  );
}

export async function deleteUserAccount(userId: number) {
  await ensureDatabase();
  if (!db) throw new Error("Database unavailable");

  await db.query(
    `DELETE FROM users
     WHERE id = $1`,
    [userId]
  );
}
