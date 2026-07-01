export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from '@/lib/auth';
import { getSession, updateUserProfile } from '@/lib/auth-db';
import { isValidPhone } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const sessionId = await getSessionCookie();
  if (!sessionId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const session = await getSession(sessionId);
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { phone, nifDni } = await req.json();
  if (!phone || !nifDni) {
    return NextResponse.json({ error: 'Faltan campos' }, { status: 400 });
  }
  if (!isValidPhone(phone)) {
    return NextResponse.json({ error: 'Teléfono no válido' }, { status: 400 });
  }

  await updateUserProfile(session.user_id, phone, nifDni);
  return NextResponse.json({ ok: true });
}