import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { markOrderAsPaid } from '@/lib/orders-db';
import { markMayoristaOrderAsPaid } from '@/lib/mayorista-db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('Webhook signature inválida:', err);
    return NextResponse.json({ error: 'Firma inválida' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;
    const { orderId, table } = session.metadata;

    if (table === 'mayorista') {
      await markMayoristaOrderAsPaid(orderId, session.id, session.payment_intent);
    } else {
      await markOrderAsPaid(orderId, session.id, session.payment_intent);
    }
  }

  return NextResponse.json({ received: true });
}