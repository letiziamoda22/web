import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie, isValidEmail, isValidPhone } from '@/lib/auth';
import { getSession, getUserByEmail, updateUserProfile } from '@/lib/auth-db';

export async function POST(req: NextRequest) {
  const sessionId = await getSessionCookie();
  if (!sessionId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const session = await getSession(sessionId);
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { name, email, phone, nifDni } = await req.json();

  const trimmedName = typeof name === 'string' ? name.trim() : '';
  const trimmedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const trimmedPhone = typeof phone === 'string' ? phone.trim() : '';
  const trimmedNifDni = typeof nifDni === 'string' ? nifDni.trim().toUpperCase() : '';

  if (!trimmedName || trimmedName.length < 2) {
    return NextResponse.json({ error: 'Nombre no válido' }, { status: 400 });
  }

  if (!trimmedEmail || !isValidEmail(trimmedEmail)) {
    return NextResponse.json({ error: 'Email no válido' }, { status: 400 });
  }

  if (!trimmedPhone || !isValidPhone(trimmedPhone)) {
    return NextResponse.json({ error: 'Teléfono no válido' }, { status: 400 });
  }

  if (!trimmedNifDni) {
    return NextResponse.json({ error: 'NIF/CIF no válido' }, { status: 400 });
  }

  if (trimmedEmail.toLowerCase() !== session.email.toLowerCase()) {
    const existingUser = await getUserByEmail(trimmedEmail);
    if (existingUser && existingUser.id !== session.user_id) {
      return NextResponse.json({ error: 'Ese email ya está en uso' }, { status: 409 });
    }
  }

  await updateUserProfile(session.user_id, {
    name: trimmedName,
    email: trimmedEmail,
    phone: trimmedPhone,
    nifDni: trimmedNifDni,
  });

  return NextResponse.json({ ok: true });
}