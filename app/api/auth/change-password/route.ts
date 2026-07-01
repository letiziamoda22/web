export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from '@/lib/auth';
import { getSession } from '@/lib/auth-db';
import { hashPassword, verifyPassword, isStrongPassword } from '@/lib/auth';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function POST(req: NextRequest) {
  const sessionId = await getSessionCookie();
  if (!sessionId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const session = await getSession(sessionId);
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  if (!session.has_password) {
    return NextResponse.json({ error: 'Esta cuenta usa Google, no tiene contraseña' }, { status: 400 });
  }

  const { currentPassword, newPassword } = await req.json();
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Faltan campos' }, { status: 400 });
  }
  if (!isStrongPassword(newPassword)) {
    return NextResponse.json({ error: 'Mínimo 8 caracteres, 1 mayúscula y 1 número' }, { status: 400 });
  }

  const rows = await sql`SELECT password_hash FROM users WHERE id = ${session.user_id}`;
  const currentHash = rows[0]?.password_hash;
  if (!currentHash || !(await verifyPassword(currentPassword, currentHash))) {
    return NextResponse.json({ error: 'Contraseña actual incorrecta' }, { status: 401 });
  }

  const newHash = await hashPassword(newPassword);
  await sql`UPDATE users SET password_hash = ${newHash} WHERE id = ${session.user_id}`;

  // Invalida todas las demás sesiones por seguridad (cierra sesión en otros dispositivos)
  await sql`DELETE FROM sessions WHERE user_id = ${session.user_id} AND id != ${sessionId}`;

  return NextResponse.json({ ok: true });
}