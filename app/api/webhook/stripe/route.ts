import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { markOrderAsPaid, getOrderById } from '@/lib/orders-db';
import { markMayoristaOrderAsPaid, getMayoristaOrderById } from '@/lib/mayorista-db';
import { sendPaidOrderEmail } from '@/lib/email';

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
      const order = await getMayoristaOrderById(orderId);
      if (order) {
        await sendPaidOrderEmail({
          order: {
            id: order.id,
            customer: order.customer,
            items: order.items.map((item) => ({
              name: item.name,
              color: item.color,
              description: item.description,
              quantity: item.quantity,
              lineTotal: item.lineTotal,
            })),
            total: order.total,
          },
          orderType: 'mayorista',
        });
      }
    } else {
      await markOrderAsPaid(orderId, session.id, session.payment_intent);
      const order = await getOrderById(orderId);
      if (order) {
        await sendPaidOrderEmail({
          order: {
            id: order.id,
            customer: order.customer,
            items: order.items.map((item) => ({
              name: item.name,
              color: item.color,
              description: item.description,
              quantity: item.quantity,
              lineTotal: item.lineTotal,
            })),
            total: order.total,
          },
          orderType: 'individual',
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}