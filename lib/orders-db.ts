import { sql } from "@/lib/db";

export type Order = {
  id: string;
  createdAt: string;
  status: string;
  source: string;
  paymentStatus: string;
  userId: number | null;
  stripeSessionId: string | null;
  stripePaymentIntent: string | null;
  billingAddress: string | null;
  billingNif: string | null;
  paidAt: string | null;
  customer: { name: string; email: string; phone: string; notes: string; };
  items: Array<{ slug: string; name: string; category: string; unitPrice: number; quantity: number; lineTotal: number; }>;
  total: number;
};

type OrderRow = {
  id: string;
  created_at: string;
  status: string;
  source: string;
  payment_status: string;
  user_id: number | null;
  stripe_session_id: string | null;
  stripe_payment_intent: string | null;
  billing_address: string | null;
  billing_nif: string | null;
  paid_at: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_notes: string;
  items: Order["items"];
  total: string;
};

function rowToOrder(row: OrderRow): Order {
  return {
    id: row.id,
    createdAt: new Date(row.created_at).toISOString(),
    status: row.status,
    source: row.source,
    paymentStatus: row.payment_status,
    userId: row.user_id,
    stripeSessionId: row.stripe_session_id,
    stripePaymentIntent: row.stripe_payment_intent,
    billingAddress: row.billing_address,
    billingNif: row.billing_nif,
    paidAt: row.paid_at ? new Date(row.paid_at).toISOString() : null,
    customer: {
      name: row.customer_name,
      email: row.customer_email,
      phone: row.customer_phone,
      notes: row.customer_notes,
    },
    items: row.items,
    total: Number(row.total),
  };
}

export async function readAllOrders(): Promise<Order[]> {
  const rows = (await sql`
    SELECT * FROM orders ORDER BY created_at DESC
  `) as OrderRow[];

  return rows.map(rowToOrder);
}

export async function getOrderById(id: string): Promise<Order | null> {
  const rows = (await sql`
    SELECT * FROM orders WHERE id = ${id} LIMIT 1
  `) as OrderRow[];

  return rows.length > 0 ? rowToOrder(rows[0]) : null;
}

// Rewrites the whole orders table to match the given array.
// Kept for compatibility with code that loads all orders, mutates
// the array in memory, and saves it back. Preserva los campos de pago
// si ya existían en el objeto Order que se pasa.
export async function writeAllOrders(orders: Order[]): Promise<void> {
  await sql`DELETE FROM orders`;

  for (const order of orders) {
    await sql`
      INSERT INTO orders (
        id, created_at, status, source, payment_status,
        user_id, stripe_session_id, stripe_payment_intent,
        billing_address, billing_nif, paid_at,
        customer_name, customer_email, customer_phone, customer_notes,
        items, total
      ) VALUES (
        ${order.id}, ${order.createdAt}, ${order.status}, ${order.source}, ${order.paymentStatus ?? 'pendiente'},
        ${order.userId ?? null}, ${order.stripeSessionId ?? null}, ${order.stripePaymentIntent ?? null},
        ${order.billingAddress ?? null}, ${order.billingNif ?? null}, ${order.paidAt ?? null},
        ${order.customer.name}, ${order.customer.email}, ${order.customer.phone}, ${order.customer.notes},
        ${JSON.stringify(order.items)}, ${order.total}
      )
    `;
  }
}

// Prefer this over readAllOrders + mutate + writeAllOrders for single-order
// updates — it's one UPDATE instead of rewriting the whole table.
export async function updateOrder(
  id: string,
  fields: Partial<Pick<Order, "status"> & { customer: Partial<Order["customer"]> }>,
): Promise<Order | null> {
  const existing = await getOrderById(id);
  if (!existing) return null;

  const status = fields.status ?? existing.status;
  const customer = { ...existing.customer, ...fields.customer };

  await sql`
    UPDATE orders SET
      status = ${status},
      customer_name = ${customer.name},
      customer_email = ${customer.email},
      customer_phone = ${customer.phone},
      customer_notes = ${customer.notes}
    WHERE id = ${id}
  `;

  return { ...existing, status, customer };
}

export async function deleteOrder(id: string): Promise<boolean> {
  const rows = (await sql`
    DELETE FROM orders WHERE id = ${id} RETURNING id
  `) as Array<{ id: string }>;

  return rows.length > 0;
}

// One row per customer, with their orders and a merged "prendas pedidas"
// list (every item across all their orders, quantities summed).
export type CustomerSection = {
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string;
  orders: Order[];
  items: Array<{
    slug: string;
    name: string;
    category: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }>;
};

export async function getOrdersGroupedByCustomer(): Promise<CustomerSection[]> {
  const orders = await readAllOrders(); // already sorted by created_at DESC
  const sections = new Map<string, CustomerSection>();

  for (const order of orders) {
    const key = order.customer.email;
    let section = sections.get(key);

    if (!section) {
      section = {
        customer: { ...order.customer },
        orderCount: 0,
        totalSpent: 0,
        lastOrderAt: order.createdAt,
        orders: [],
        items: [],
      };
      sections.set(key, section);
    }

    section.orderCount += 1;
    section.totalSpent += order.total;
    section.orders.push(order);

    // Keep the most recent name/phone in case it changed across orders.
    if (order.createdAt > section.lastOrderAt) {
      section.lastOrderAt = order.createdAt;
      section.customer.name = order.customer.name;
      section.customer.phone = order.customer.phone;
    }

    const itemsBySlug = new Map(section.items.map((item) => [item.slug, item]));

    for (const item of order.items) {
      const existing = itemsBySlug.get(item.slug);

      if (existing) {
        existing.quantity += item.quantity;
        existing.lineTotal += item.lineTotal;
      } else {
        const merged = { ...item };
        itemsBySlug.set(item.slug, merged);
        section.items.push(merged);
      }
    }
  }

  return Array.from(sections.values()).sort(
    (a, b) => new Date(b.lastOrderAt).getTime() - new Date(a.lastOrderAt).getTime(),
  );
}

export type PendingOrderInput = {
  userId: number | null;
  customer: Order["customer"];
  items: Order["items"];
  total: number;
  billingAddress: string;
  billingNif: string;
};
// Crea el pedido en estado "pendiente" antes de mandar a Stripe
export async function createPendingOrder(input: PendingOrderInput): Promise<string> {
  const rows = (await sql`
    INSERT INTO orders (
      id, created_at, status, source, payment_status,
      user_id, customer_name, customer_email, customer_phone, customer_notes,
      billing_address, billing_nif, items, total
    ) VALUES (
      gen_random_uuid(), NOW(), 'nuevo', 'web', 'pendiente',
      ${input.userId}, ${input.customer.name}, ${input.customer.email}, ${input.customer.phone}, ${input.customer.notes},
      ${input.billingAddress}, ${input.billingNif}, ${JSON.stringify(input.items)}, ${input.total}
    )
    RETURNING id
  `) as Array<{ id: string }>;

  return rows[0].id;
}

// Llamado SOLO desde el webhook de Stripe, cuando el pago se confirma
export async function markOrderAsPaid(
  orderId: string,
  stripeSessionId: string,
  stripePaymentIntent: string,
): Promise<void> {
  await sql`
    UPDATE orders SET
      payment_status = 'pagado',
      stripe_session_id = ${stripeSessionId},
      stripe_payment_intent = ${stripePaymentIntent},
      paid_at = NOW()
    WHERE id = ${orderId}
  `;
}

// Para "Mis pedidos" del cliente logueado
export async function getOrdersByUserId(userId: number): Promise<Order[]> {
  const rows = (await sql`
    SELECT * FROM orders WHERE user_id = ${userId} ORDER BY created_at DESC
  `) as OrderRow[];

  return rows.map(rowToOrder);
}