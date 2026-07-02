import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export interface User {
  id: number;
  email: string;
  name: string | null;
  phone: string | null;
  nif_dni: string | null;
  password_hash: string | null;
  google_id: string | null;
  created_at: string;
  failed_login_attempts: number;
  locked_until: string | null;
  email_verified: boolean;
}

export async function initAuthTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255),
      google_id VARCHAR(255) UNIQUE,
      name VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW(),
      failed_login_attempts INT DEFAULT 0,
      locked_until TIMESTAMP,
      email_verified BOOLEAN DEFAULT FALSE
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id VARCHAR(255) PRIMARY KEY,
      user_id INT REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const rows = await sql`SELECT * FROM users WHERE email = ${email.toLowerCase()}`;
  return (rows[0] as User) || null;
}

export async function getUserByGoogleId(googleId: string): Promise<User | null> {
  const rows = await sql`SELECT * FROM users WHERE google_id = ${googleId}`;
  return (rows[0] as User) || null;
}

export async function getUserById(id: number): Promise<User | null> {
  const rows = await sql`SELECT * FROM users WHERE id = ${id}`;
  return (rows[0] as User) || null;
}
export async function getUserByNifDni(nifDni: string): Promise<User | null> {
  const rows = await sql`SELECT * FROM users WHERE nif_dni = ${nifDni.toUpperCase()}`;
  return (rows[0] as User) || null;
}


export async function createUser(
  email: string,
  passwordHash: string | null,
  name: string,
  phone: string | null = null,
  nifDni: string | null = null,
  googleId: string | null = null
): Promise<User> {
  const rows = await sql`
    INSERT INTO users (email, password_hash, name, phone, nif_dni, google_id, email_verified)
    VALUES (${email.toLowerCase()}, ${passwordHash}, ${name}, ${phone}, ${nifDni ? nifDni.toUpperCase() : null}, ${googleId}, ${googleId ? true : false})
    RETURNING *
  `;
  return rows[0] as User;
}

export async function linkGoogleAccount(userId: number, googleId: string) {
  await sql`UPDATE users SET google_id = ${googleId}, email_verified = true WHERE id = ${userId}`;
}

export async function registerFailedLogin(userId: number) {
  await sql`
    UPDATE users
    SET failed_login_attempts = failed_login_attempts + 1,
        locked_until = CASE WHEN failed_login_attempts + 1 >= 5
          THEN NOW() + INTERVAL '15 minutes' ELSE locked_until END
    WHERE id = ${userId}
  `;
}

export async function resetFailedLogins(userId: number) {
  await sql`UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ${userId}`;
}

export async function createSession(sessionId: string, userId: number, expiresAt: Date) {
  await sql`INSERT INTO sessions (id, user_id, expires_at) VALUES (${sessionId}, ${userId}, ${expiresAt.toISOString()})`;
}

export async function getSession(sessionId: string) {
  const rows = await sql`
    SELECT s.id, s.user_id, s.expires_at, u.email, u.name, u.email_verified,
           u.phone, u.nif_dni,
           (u.password_hash IS NOT NULL) AS has_password
    FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.id = ${sessionId} AND s.expires_at > NOW()
  `;
  return rows[0] || null;
}

export async function deleteSession(sessionId: string) {
  await sql`DELETE FROM sessions WHERE id = ${sessionId}`;
}

export async function deleteAllUserSessions(userId: number) {
  await sql`DELETE FROM sessions WHERE user_id = ${userId}`;
}
export async function updateUserProfile(
  userId: number,
  updates: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    nifDni?: string | null;
  }
) {
  await sql`
    UPDATE users
    SET
      name = ${updates.name ?? null},
      email = ${updates.email ?? null},
      phone = ${updates.phone ?? null},
      nif_dni = ${updates.nifDni ? updates.nifDni.toUpperCase() : null}
    WHERE id = ${userId}
  `;
}