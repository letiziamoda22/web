import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, getUserByNifDni, createUser, createSession, deleteSession } from '@/lib/auth-db';
import {
  hashPassword, isValidEmail, isStrongPassword, isValidPhone,
  generateSessionId, setSessionCookie, SESSION_DURATION, getSessionCookie,
} from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, phone, nifDni } = await req.json();

    if (!email || !password || !name || !phone || !nifDni) {
      return NextResponse.json({ error: 'Faltan campos' }, { status: 400 });
    }
    if (!isValidEmail(email)) return NextResponse.json({ error: 'Email no válido' }, { status: 400 });
    if (!isStrongPassword(password)) {
      return NextResponse.json({ error: 'Mínimo 8 caracteres, 1 mayúscula y 1 número' }, { status: 400 });
    }
    if (!isValidPhone(phone)) return NextResponse.json({ error: 'Teléfono no válido' }, { status: 400 });

    if (await getUserByEmail(email)) return NextResponse.json({ error: 'Ese email ya está registrado' }, { status: 409 });
    if (await getUserByNifDni(nifDni)) return NextResponse.json({ error: 'Ese DNI/NIF ya está registrado' }, { status: 409 });

    const passwordHash = await hashPassword(password);
    const user = await createUser(email, passwordHash, name, phone, nifDni, null);

    const oldSessionId = await getSessionCookie();
    if (oldSessionId) await deleteSession(oldSessionId);

    const sessionId = generateSessionId();
    await createSession(sessionId, user.id, new Date(Date.now() + SESSION_DURATION));
    await setSessionCookie(sessionId);

    return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    console.error('Error registro:', err);
    return NextResponse.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}