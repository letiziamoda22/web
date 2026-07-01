import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getSessionCookie } from '@/lib/auth';
import { getSession } from '@/lib/auth-db';
import { createPendingOrder } from '@/lib/orders-db';
import { createPendingMayoristaOrder } from '@/lib/mayorista-db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const {
      items,
      accountType,
      billingAddress,
      notes,
      paymentFee,
      deliveryFee,
      guestName,
      guestEmail,
      guestPhone,
      guestNif,
    } = await req.json();

    if (!items?.length) return NextResponse.json({ error: 'Carrito vacio' }, { status: 400 });
    if (!billingAddress) return NextResponse.json({ error: 'Falta la direccion de facturacion' }, { status: 400 });

    // anonimo no requiere sesion; autonomo y empresa si.
    let userSession: Awaited<ReturnType<typeof getSession>> | null = null;

    if (accountType !== 'anonimo') {
      const sessionId = await getSessionCookie();
      if (!sessionId) return NextResponse.json({ error: 'Debes iniciar sesion para comprar' }, { status: 401 });

      userSession = await getSession(sessionId);
      if (!userSession) return NextResponse.json({ error: 'Sesion no valida' }, { status: 401 });
    }

    if (accountType === 'empresa' && !userSession?.nif_dni) {
      return NextResponse.json({ error: 'Tu cuenta no tiene NIF/CIF registrado' }, { status: 400 });
    }

    if (accountType === 'anonimo' && (!guestName || !guestPhone || !guestNif)) {
      return NextResponse.json({ error: 'Faltan datos del comprador anonimo' }, { status: 400 });
    }

    const itemsTotal = items.reduce((sum: number, i: any) => sum + i.unitPrice * i.quantity, 0);
    const fee = Number(paymentFee) || 0;
    const delivery = Number(deliveryFee) || 0;
    const total = Number((itemsTotal + fee + delivery).toFixed(2));

    let orderId: string;
    let table: 'orders' | 'mayorista';
    let customerEmailForStripe: string | undefined;

    if (accountType === 'empresa') {
      orderId = await createPendingMayoristaOrder({
        userId: userSession!.user_id,
        customer: {
          name: userSession!.name,
          nif: userSession!.nif_dni,
          email: userSession!.email,
          address: billingAddress,
          phone: userSession!.phone,
          notes: notes || '',
        },
        items,
        total,
      });
      table = 'mayorista';
      customerEmailForStripe = userSession!.email;
    } else if (accountType === 'anonimo') {
      orderId = await createPendingOrder({
        userId: null,
        customer: {
          name: guestName,
          email: guestEmail || '',
          phone: guestPhone,
          notes: notes || '',
        },
        items,
        total,
        billingAddress,
        billingNif: guestNif,
      });
      table = 'orders';
      customerEmailForStripe = guestEmail || undefined;
    } else {
      // autonomo
      orderId = await createPendingOrder({
        userId: userSession!.user_id,
        customer: {
          name: userSession!.name,
          email: userSession!.email,
          phone: userSession!.phone,
          notes: notes || '',
        },
        items,
        total,
        billingAddress,
        billingNif: userSession!.nif_dni,
      });
      table = 'orders';
      customerEmailForStripe = userSession!.email;
    }

    const line_items = items.map((item: any) => ({
      price_data: {
        currency: 'eur',
        product_data: { name: item.color ? `${item.name} — ${item.color}` : item.name },
        unit_amount: Math.round(item.unitPrice * 100),
      },
      quantity: item.quantity,
    }));

    if (fee > 0) {
      line_items.push({
        price_data: {
          currency: 'eur',
          product_data: { name: 'Gastos de gestion (1,4% + 0,25€)' },
          unit_amount: Math.round(fee * 100),
        },
        quantity: 1,
      });
    }

    if (delivery > 0) {
      line_items.push({
        price_data: {
          currency: 'eur',
          product_data: { name: 'Entrega' },
          unit_amount: Math.round(delivery * 100),
        },
        quantity: 1,
      });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items,
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pedido/exito?order_id=${orderId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/carrito`,
      ...(customerEmailForStripe ? { customer_email: customerEmailForStripe } : {}),
      metadata: { orderId, table },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error('Error checkout:', err);
    return NextResponse.json({ error: 'Error al iniciar el pago' }, { status: 500 });
  }
}