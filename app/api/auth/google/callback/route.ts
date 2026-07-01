import { NextRequest, NextResponse } from 'next/server';
import { getUserByGoogleId, getUserByEmail, createUser, linkGoogleAccount, createSession } from '@/lib/auth-db';
import { generateSessionId, setSessionCookie, SESSION_DURATION } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const savedState = req.cookies.get('oauth_state')?.value;

  if (!code || !state || state !== savedState) {
    return NextResponse.redirect(new URL('/login?error=oauth', req.url));
  }

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
        grant_type: 'authorization_code',
      }),
    });
    const tokens = await tokenRes.json();
    if (!tokens.access_token) throw new Error('Sin access_token');

    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const googleUser = await userInfoRes.json();

    let user = await getUserByGoogleId(googleUser.id);
    if (!user) {
      const existing = await getUserByEmail(googleUser.email);
      if (existing) {
        await linkGoogleAccount(existing.id, googleUser.id);
        user = existing;
      } else {
          user = await createUser(googleUser.email, null, googleUser.name, null, null, googleUser.id);
      }
    }

    const sessionId = generateSessionId();
    await createSession(sessionId, user.id, new Date(Date.now() + SESSION_DURATION));
    await setSessionCookie(sessionId);

    const needsProfile = !user.phone || !user.nif_dni;
    const res = NextResponse.redirect(new URL(needsProfile ? '/completar-perfil' : '/', req.url));
    res.cookies.delete('oauth_state');
    return res;
  } catch (err) {
    console.error('Error callback Google:', err);
    return NextResponse.redirect(new URL('/login?error=oauth', req.url));
  }
}