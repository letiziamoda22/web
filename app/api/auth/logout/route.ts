import { NextResponse } from 'next/server';
import { getSessionCookie, clearSessionCookie } from '@/lib/auth';
import { deleteSession } from '@/lib/auth-db';

export async function POST() {
  const sessionId = await getSessionCookie();
  if (sessionId) await deleteSession(sessionId);
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}