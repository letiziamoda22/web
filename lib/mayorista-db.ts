import { sql } from "@/lib/db";

export type MayoristaOrder = {
  id: string;
  createdAt: string;
  status: string;
  source: string;
  paymentStatus: string;
  userId: number | null;
  stripeSessionId: string | null;
  stripePaymentIntent: string | null;
  paidAt: string | null;
  customer: {
    name: string;
    nif: string;
    email: string;
    address: string;
    phone: string;
    notes: string;
  };
  items: Array<{
    slug: string;
    name: string;
    color?: string;
    description?: string;
    category: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }>;
  total: number;
};

type MayoristaRow = {
  id: string;
  created_at: string;
  status: string;
  source: string;
  payment_status: string;
  user_id: number | null;
  stripe_session_id: string | null;
  stripe_payment_intent: string | null;
  paid_at: string | null;
  customer_name: string;
  custumer_nif: string;
  customer_email: string;
  custumer_address: string;
  customer_phone: string;
  customer_notes: string;
  items: MayoristaOrder["items"];
  total: string;
};

function rowToOrder(row: MayoristaRow): MayoristaOrder {
  return {
    id: row.id,
    createdAt: new Date(row.created_at).toISOString(),
    status: row.status,
    source: row.source,
    paymentStatus: row.payment_status,
    userId: row.user_id,
    stripeSessionId: row.stripe_session_id,
    stripePaymentIntent: row.stripe_payment_intent,
    paidAt: row.paid_at ? new Date(row.paid_at).toISOString() : null,
    customer: {
      name: row.customer_name,
      nif: row.custumer_nif,
      email: row.customer_email,
      address: row.custumer_address,
      phone: row.customer_phone,
      notes: row.customer_notes,
    },
    items: row.items,
    total: Number(row.total),
  };
}

export async function readAllMayoristaOrders(): Promise<MayoristaOrder[]> {
  const rows = (await sql`
    SELECT * FROM mayorista ORDER BY created_at DESC
  `) as MayoristaRow[];

  return rows.map(rowToOrder);
}

// Busca UN pedido por su id propio (uso en update/delete/admin)
export async function getMayoristaOrderById(id: string): Promise<MayoristaOrder | null> {
  const rows = (await sql`
    SELECT * FROM mayorista WHERE id = ${id} LIMIT 1
  `) as MayoristaRow[];

  return rows.length > 0 ? rowToOrder(rows[0]) : null;
}

// Lista TODOS los pedidos de un cliente logueado (uso en "Mis pedidos")
export async function getMayoristaOrdersByUserId(userId: number): Promise<MayoristaOrder[]> {
  const rows = (await sql`
    SELECT * FROM mayorista WHERE user_id = ${userId} ORDER BY created_at DESC
  `) as MayoristaRow[];

  return rows.map(rowToOrder);
}

export async function updateMayoristaOrder(
  id: string,
  fields: Partial<Pick<MayoristaOrder, "status"> & { customer: Partial<MayoristaOrder["customer"]> }>,
): Promise<MayoristaOrder | null> {
  const existing = await getMayoristaOrderById(id);
  if (!existing) return null;

  const status = fields.status ?? existing.status;
  const customer = { ...existing.customer, ...fields.customer };

  await sql`
    UPDATE mayorista SET
      status = ${status},
      customer_name = ${customer.name},
      custumer_nif = ${customer.nif},
      customer_email = ${customer.email},
      custumer_address = ${customer.address},
      customer_phone = ${customer.phone},
      customer_notes = ${customer.notes}
    WHERE id = ${id}
  `;

  return { ...existing, status, customer };
}

export async function deleteMayoristaOrder(id: string): Promise<boolean> {
  const rows = (await sql`
    DELETE FROM mayorista WHERE id = ${id} RETURNING id
  `) as Array<{ id: string }>;

  return rows.length > 0;
}

export type MayoristaCustomerSection = {
  customer: {
    name: string;
    nif: string;
    email: string;
    address: string;
    phone: string;
  };
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string;
  orders: MayoristaOrder[];
  items: Array<{
    slug: string;
    name: string;
    color?: string;
    description?: string;
    category: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }>;
};

export async function getMayoristaOrdersGroupedByCustomer(): Promise<MayoristaCustomerSection[]> {
  const orders = await readAllMayoristaOrders(); // already sorted by created_at DESC
  const sections = new Map<string, MayoristaCustomerSection>();

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

    if (order.createdAt > section.lastOrderAt) {
      section.lastOrderAt = order.createdAt;
      section.customer.name = order.customer.name;
      section.customer.nif = order.customer.nif;
      section.customer.address = order.customer.address;
      section.customer.phone = order.customer.phone;
    }

    const itemsByKey = new Map(section.items.map((item) => [item.slug + "::" + (item.color ?? ""), item]));

    for (const item of order.items) {
      const itemKey = item.slug + "::" + (item.color ?? "");
      const existing = itemsByKey.get(itemKey);

      if (existing) {
        existing.quantity += item.quantity;
        existing.lineTotal += item.lineTotal;
      } else {
        const merged = { ...item };
        itemsByKey.set(itemKey, merged);
        section.items.push(merged);
      }
    }
  }

  return Array.from(sections.values()).sort(
    (a, b) => new Date(b.lastOrderAt).getTime() - new Date(a.lastOrderAt).getTime(),
  );
}

export type PendingMayoristaOrderInput = {
  userId: number;
  customer: MayoristaOrder["customer"];
  items: MayoristaOrder["items"];
  total: number;
};

export async function createPendingMayoristaOrder(input: PendingMayoristaOrderInput): Promise<string> {
  const rows = (await sql`
    INSERT INTO mayorista (
      id, created_at, status, source, payment_status,
      user_id, customer_name, custumer_nif, customer_email, custumer_address, customer_phone, customer_notes,
      items, total
    ) VALUES (
      gen_random_uuid(), NOW(), 'nuevo', 'web', 'pendiente',
      ${input.userId}, ${input.customer.name}, ${input.customer.nif}, ${input.customer.email}, ${input.customer.address}, ${input.customer.phone}, ${input.customer.notes},
      ${JSON.stringify(input.items)}, ${input.total}
    )
    RETURNING id
  `) as Array<{ id: string }>;

  return rows[0].id;
}

export async function markMayoristaOrderAsPaid(
  orderId: string,
  stripeSessionId: string,
  stripePaymentIntent: string,
): Promise<void> {
  await sql`
    UPDATE mayorista SET
      payment_status = 'pagado',
      stripe_session_id = ${stripeSessionId},
      stripe_payment_intent = ${stripePaymentIntent},
      paid_at = NOW()
    WHERE id = ${orderId}
  `;
}