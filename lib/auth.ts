import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'session_id';
export const SESSION_DURATION = 1000 * 60 * 60 * 24 * 30; // 30 dias

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function generateSessionId() {
  return randomBytes(32).toString('hex');
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isStrongPassword(password: string) {
  return password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
}

export async function setSessionCookie(sessionId: string) {
  (await cookies()).set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION / 1000,
  });
}

export async function getSessionCookie() {
  return (await cookies()).get(SESSION_COOKIE)?.value || null;
}

export async function clearSessionCookie() {
  (await cookies()).delete(SESSION_COOKIE);
}

export function isValidPhone(phone: string): boolean {
  // acepta formatos españoles: 6XXXXXXXX, 7XXXXXXXX, 9XXXXXXXX, con o sin +34
  return /^(\+34|0034)?[6789]\d{8}$/.test(phone.replace(/\s/g, ''));
}