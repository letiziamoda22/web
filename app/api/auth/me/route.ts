export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getSessionCookie } from '@/lib/auth';
import { getSession } from '@/lib/auth-db';

export async function GET() {
  const sessionId = await getSessionCookie();
  if (!sessionId) return NextResponse.json({ user: null });
  const session = await getSession(sessionId);
  if (!session) return NextResponse.json({ user: null });

  return NextResponse.json({
    user: {
      id: session.user_id,
      email: session.email,
      name: session.name,
      hasPassword: session.has_password,
      phone: session.phone,
      nifDni: session.nif_dni,
      needsProfileCompletion: !session.phone || !session.nif_dni,
    },
  });
}