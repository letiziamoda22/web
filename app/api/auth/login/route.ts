import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, registerFailedLogin, resetFailedLogins, createSession } from '@/lib/auth-db';
import { verifyPassword, generateSessionId, setSessionCookie, SESSION_DURATION } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return NextResponse.json({ error: 'Faltan campos' }, { status: 400 });

    const user = await getUserByEmail(email);
    const generic = NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
    if (!user || !user.password_hash) return generic;

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return NextResponse.json({ error: 'Cuenta bloqueada temporalmente, intenta en unos minutos' }, { status: 423 });
    }

    if (!(await verifyPassword(password, user.password_hash))) {
      await registerFailedLogin(user.id);
      return generic;
    }
    await resetFailedLogins(user.id);

    const sessionId = generateSessionId();
    await createSession(sessionId, user.id, new Date(Date.now() + SESSION_DURATION));
    await setSessionCookie(sessionId);

    return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    console.error('Error login:', err);
    return NextResponse.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}