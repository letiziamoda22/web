import { NextResponse } from 'next/server';
import { getSessionCookie } from '@/lib/auth';
import { getSession } from '@/lib/auth-db';
import { getOrdersByUserId } from '@/lib/orders-db';
import { getMayoristaOrdersByUserId } from '@/lib/mayorista-db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const sessionId = await getSessionCookie();
  if (!sessionId) return NextResponse.json({ orders: [] });

  const session = await getSession(sessionId);
  if (!session) return NextResponse.json({ orders: [] });

  const [individual, mayorista] = await Promise.all([
    getOrdersByUserId(session.user_id),
    getMayoristaOrdersByUserId(session.user_id),
  ]);

  const orders = [...individual, ...mayorista].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return NextResponse.json({ orders });
}