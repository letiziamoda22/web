import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from '@/lib/auth';
import { getSession } from '@/lib/auth-db';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function POST(req: NextRequest) {
  const sessionId = await getSessionCookie();
  if (!sessionId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const session = await getSession(sessionId);
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { name } = await req.json();
  if (!name || name.trim().length < 2) {
    return NextResponse.json({ error: 'Nombre no válido' }, { status: 400 });
  }

  await sql`UPDATE users SET name = ${name.trim()} WHERE id = ${session.user_id}`;
  return NextResponse.json({ ok: true });
}