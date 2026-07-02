import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from '@/lib/auth';
import { getSession } from '@/lib/auth-db';
import { sendAccountDeletionEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  const sessionId = await getSessionCookie();
  if (!sessionId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const session = await getSession(sessionId);
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const payload = await req.json().catch(() => ({}));
  const name = typeof payload.name === 'string' ? payload.name.trim() : session.name ?? 'Sin nombre';
  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : session.email;
  const phone = typeof payload.phone === 'string' ? payload.phone.trim() : session.phone ?? '-';
  const nifDni = typeof payload.nifDni === 'string' ? payload.nifDni.trim().toUpperCase() : session.nif_dni ?? '-';

  await sendAccountDeletionEmail({
    name,
    email,
    phone,
    nifDni,
    userId: session.user_id,
  });

  return NextResponse.json({ ok: true });
}
