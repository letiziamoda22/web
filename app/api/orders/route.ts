import { sql } from "@/lib/db";
import { products } from "@/lib/catalog";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 16_384;
const MAX_ITEMS = 30;
const MAX_QUANTITY_PER_PRODUCT = 99;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;

const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

type IncomingOrder = {
  customer?: {
    name?: unknown;
    email?: unknown;
    phone?: unknown;
    notes?: unknown;
  };
  items?: unknown;
};

type IncomingItem = {
  slug?: unknown;
  quantity?: unknown;
};

export type Order = {
  id: string;
  createdAt: string;
  status: string;
  source: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    notes: string;
  };
  items: Array<{
    slug: string;
    name: string;
    category: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }>;
  total: number;
};

type UpdateOrderPayload = {
  status?: string;
  customer?: Partial<Order["customer"]>;
};

// Row shape as it comes back from Postgres.
type OrderRow = {
  id: string;
  created_at: string;
  status: string;
  source: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_notes: string;
  items: Order["items"];
  total: string; // numeric comes back as string
};

function rowToOrder(row: OrderRow): Order {
  return {
    id: row.id,
    createdAt: new Date(row.created_at).toISOString(),
    status: row.status,
    source: row.source,
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

function jsonResponse(body: unknown, status = 200, request?: Request) {
  const headers: Record<string, string> = {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
  };

  if (request && isAllowedOrigin(request)) {
    const origin = request.headers.get("origin");
    if (origin) {
      headers["Access-Control-Allow-Origin"] = origin;
    }
  }

  return Response.json(body, { status, headers });
}

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, maxLength);
}

function priceToNumber(price: string) {
  return Number(price.replace(/[^0-9.]/g, ""));
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isIncomingItem(item: unknown): item is IncomingItem {
  return typeof item === "object" && item !== null;
}

function getRequestIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}

function isRateLimited(request: Request) {
  const now = Date.now();
  const key = getRequestIp(request);
  const currentBucket = rateLimitBuckets.get(key);

  for (const [bucketKey, bucket] of rateLimitBuckets) {
    if (bucket.resetAt <= now) {
      rateLimitBuckets.delete(bucketKey);
    }
  }

  if (!currentBucket || currentBucket.resetAt <= now) {
    rateLimitBuckets.set(key, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return false;
  }

  currentBucket.count += 1;
  return currentBucket.count > RATE_LIMIT_MAX_REQUESTS;
}

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? "").split(",").map((origin) => origin.trim()).filter(Boolean);

function isAllowedOrigin(request: Request) {
  const origin = request.headers.get("origin");

  if (!origin) {
    return true;
  }

  if (ALLOWED_ORIGINS.includes(origin)) {
    return true;
  }

  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? new URL(request.url).protocol.replace(":", "");

  if (!host) {
    return false;
  }

  try {
    const requestOrigin = `${proto}://${host}`;
    if (new URL(origin).origin === requestOrigin) {
      return true;
    }

    const originUrl = new URL(origin);
    const hostUrl = new URL(requestOrigin);

    if (originUrl.hostname === "localhost" && hostUrl.hostname === "localhost") {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

export async function OPTIONS(request: Request) {
  if (!isAllowedOrigin(request)) {
    return jsonResponse({ error: "Origen no permitido." }, 403, request);
  }

  const origin = request.headers.get("origin") ?? "*";
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,x-api-key",
      "Access-Control-Max-Age": "86400",
    },
  });
}

function validateApiKey(request: Request): boolean {
  const apiKey = request.headers.get("x-api-key");
  const expectedKey = process.env.ORDERS_API_KEY;

  if (!expectedKey) {
    console.warn("ORDERS_API_KEY not configured in environment variables");
    return false;
  }

  return apiKey === expectedKey;
}

async function readLimitedJson<T = unknown>(request: Request): Promise<T> {
  const contentLength = request.headers.get("content-length");

  if (contentLength && Number(contentLength) > MAX_BODY_BYTES) {
    throw new Error("BODY_TOO_LARGE");
  }

  if (!request.body) {
    throw new Error("EMPTY_BODY");
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let receivedBytes = 0;

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    receivedBytes += value.byteLength;

    if (receivedBytes > MAX_BODY_BYTES) {
      throw new Error("BODY_TOO_LARGE");
    }

    chunks.push(value);
  }

  const body = new Uint8Array(receivedBytes);
  let offset = 0;

  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return JSON.parse(new TextDecoder().decode(body)) as T;
}

export async function POST(request: Request) {
  let payload: IncomingOrder;

  if (isRateLimited(request)) {
    return jsonResponse({ error: "Demasiadas solicitudes. Intentalo de nuevo en un minuto." }, 429, request);
  }

  if (!isAllowedOrigin(request)) {
    return jsonResponse({ error: "Origen no permitido." }, 403, request);
  }

  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.toLowerCase().startsWith("application/json")) {
    return jsonResponse({ error: "La solicitud debe enviarse como JSON." }, 415, request);
  }

  try {
    payload = await readLimitedJson<IncomingOrder>(request);
  } catch (error) {
    if (error instanceof Error && error.message === "BODY_TOO_LARGE") {
      return jsonResponse({ error: "El pedido es demasiado grande." }, 413, request);
    }

    return jsonResponse({ error: "El cuerpo del pedido no es JSON valido." }, 400, request);
  }

  const customer = {
    name: cleanText(payload.customer?.name, 90),
    email: cleanText(payload.customer?.email, 120).toLowerCase(),
    phone: cleanText(payload.customer?.phone, 40),
    notes: cleanText(payload.customer?.notes, 800),
  };

  if (customer.name.length < 2) {
    return jsonResponse({ error: "Indica un nombre valido." }, 400, request);
  }

  if (!isValidEmail(customer.email)) {
    return jsonResponse({ error: "Indica un email valido." }, 400, request);
  }

  if (customer.phone.length < 6) {
    return jsonResponse({ error: "Indica un WhatsApp o telefono valido." }, 400, request);
  }

  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    return jsonResponse({ error: "El carrito esta vacio." }, 400, request);
  }

  if (payload.items.length > MAX_ITEMS) {
    return jsonResponse({ error: "Demasiadas lineas de pedido." }, 400, request);
  }

  const catalogBySlug = new Map(products.map((product) => [product.slug, product]));
  const mergedItems = new Map<string, number>();

  for (const rawItem of payload.items) {
    if (!isIncomingItem(rawItem) || typeof rawItem.slug !== "string") {
      return jsonResponse({ error: "El carrito contiene una prenda no valida." }, 400, request);
    }

    const product = catalogBySlug.get(rawItem.slug);

    if (!product) {
      return jsonResponse({ error: "El carrito contiene una prenda no disponible." }, 400, request);
    }

    const quantity = Number(rawItem.quantity);

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY_PER_PRODUCT) {
      return jsonResponse({ error: `Cantidad no valida para ${product.name}.` }, 400, request);
    }

    const nextQuantity = (mergedItems.get(product.slug) ?? 0) + quantity;

    if (nextQuantity > MAX_QUANTITY_PER_PRODUCT) {
      return jsonResponse({ error: `Cantidad maxima superada para ${product.name}.` }, 400, request);
    }

    mergedItems.set(product.slug, nextQuantity);
  }

  const items = Array.from(mergedItems.entries()).map(([slug, quantity]) => {
    const product = catalogBySlug.get(slug);

    if (!product) {
      throw new Error("Product vanished while creating order");
    }

    const unitPrice = priceToNumber(product.price);

    return {
      slug: product.slug,
      name: product.name,
      category: product.category,
      unitPrice,
      quantity,
      lineTotal: unitPrice * quantity,
    };
  });

  const total = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const id = crypto.randomUUID();
  const status = "pending";
  const source = "web-cart";

  try {
    await sql`
      INSERT INTO orders (
        id, status, source,
        customer_name, customer_email, customer_phone, customer_notes,
        items, total
      ) VALUES (
        ${id}, ${status}, ${source},
        ${customer.name}, ${customer.email}, ${customer.phone}, ${customer.notes},
        ${JSON.stringify(items)}, ${total}
      )
    `;
  } catch (error) {
    console.error("Could not persist order", error);
    return jsonResponse({ error: "No se pudo guardar el pedido en el servidor." }, 500, request);
  }

  return jsonResponse(
    {
      orderId: id,
      status,
      total,
      items: items.length,
    },
    201,
    request,
  );
}

export async function GET(request: Request) {
  if (!validateApiKey(request)) {
    return jsonResponse({ error: "Unauthorized: Invalid API key" }, 401, request);
  }

  if (!isAllowedOrigin(request)) {
    return jsonResponse({ error: "Origen no permitido." }, 403, request);
  }

  const url = new URL(request.url);
  const orderId = url.searchParams.get("id");
  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "100", 10) || 100, 1), 200);
  const offset = Math.max(parseInt(url.searchParams.get("offset") || "0", 10) || 0, 0);
  const status = url.searchParams.get("status");
  const email = url.searchParams.get("email");

  try {
    if (orderId) {
      const rows = (await sql`
        SELECT * FROM orders WHERE id = ${orderId} LIMIT 1
      `) as OrderRow[];

      if (rows.length === 0) {
        return jsonResponse({ error: "Orden no encontrada." }, 404, request);
      }

      return jsonResponse({ order: rowToOrder(rows[0]) }, 200, request);
    }

    const emailFilter = email ? email.toLowerCase() : null;

    const rows = (await sql`
      SELECT * FROM orders
      WHERE (${status}::text IS NULL OR status = ${status})
        AND (${emailFilter}::text IS NULL OR customer_email = ${emailFilter})
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `) as OrderRow[];

    const countRows = (await sql`
      SELECT COUNT(*)::int AS count FROM orders
      WHERE (${status}::text IS NULL OR status = ${status})
        AND (${emailFilter}::text IS NULL OR customer_email = ${emailFilter})
    `) as Array<{ count: number }>;

    const total = countRows[0]?.count ?? 0;

    return jsonResponse(
      {
        orders: rows.map(rowToOrder),
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
      200,
      request,
    );
  } catch (error) {
    console.error("Error reading orders:", error);
    return jsonResponse({ error: "Error al leer los pedidos." }, 500, request);
  }
}

export async function PUT(request: Request) {
  if (!validateApiKey(request)) {
    return jsonResponse({ error: "Unauthorized: Invalid API key" }, 401, request);
  }

  if (!isAllowedOrigin(request)) {
    return jsonResponse({ error: "Origen no permitido." }, 403, request);
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return jsonResponse({ error: "La solicitud debe enviarse como JSON." }, 415, request);
  }

  let payload: { id: string; update: UpdateOrderPayload };

  try {
    payload = await readLimitedJson<{ id: string; update: UpdateOrderPayload }>(request);
  } catch (error) {
    if (error instanceof Error && error.message === "BODY_TOO_LARGE") {
      return jsonResponse({ error: "El pedido es demasiado grande." }, 413, request);
    }
    return jsonResponse({ error: "El cuerpo del pedido no es JSON valido." }, 400, request);
  }

  if (!payload.id || typeof payload.id !== "string") {
    return jsonResponse({ error: "ID de orden requerido." }, 400, request);
  }

  try {
    const existingRows = (await sql`
      SELECT * FROM orders WHERE id = ${payload.id} LIMIT 1
    `) as OrderRow[];

    if (existingRows.length === 0) {
      return jsonResponse({ error: "Orden no encontrada." }, 404, request);
    }

    const order = rowToOrder(existingRows[0]);

    if (payload.update.status && typeof payload.update.status === "string") {
      order.status = payload.update.status;
    }

    if (payload.update.customer) {
      const { name, email, phone, notes } = payload.update.customer;

      if (name && typeof name === "string") {
        const cleanedName = cleanText(name, 90);
        if (cleanedName.length < 2) {
          return jsonResponse({ error: "Nombre no valido." }, 400, request);
        }
        order.customer.name = cleanedName;
      }

      if (email && typeof email === "string") {
        const cleanedEmail = cleanText(email, 120).toLowerCase();
        if (!isValidEmail(cleanedEmail)) {
          return jsonResponse({ error: "Email no valido." }, 400, request);
        }
        order.customer.email = cleanedEmail;
      }

      if (phone && typeof phone === "string") {
        const cleanedPhone = cleanText(phone, 40);
        if (cleanedPhone.length < 6) {
          return jsonResponse({ error: "Telefono no valido." }, 400, request);
        }
        order.customer.phone = cleanedPhone;
      }

      if (notes !== undefined && typeof notes === "string") {
        order.customer.notes = cleanText(notes, 800);
      }
    }

    await sql`
      UPDATE orders SET
        status = ${order.status},
        customer_name = ${order.customer.name},
        customer_email = ${order.customer.email},
        customer_phone = ${order.customer.phone},
        customer_notes = ${order.customer.notes}
      WHERE id = ${payload.id}
    `;

    return jsonResponse(
      {
        message: "Orden actualizada correctamente.",
        order,
      },
      200,
      request,
    );
  } catch (error) {
    console.error("Error updating order:", error);
    return jsonResponse({ error: "Error al actualizar la orden." }, 500, request);
  }
}

export async function DELETE(request: Request) {
  if (!validateApiKey(request)) {
    return jsonResponse({ error: "Unauthorized: Invalid API key" }, 401, request);
  }

  if (!isAllowedOrigin(request)) {
    return jsonResponse({ error: "Origen no permitido." }, 403, request);
  }

  const url = new URL(request.url);
  const orderId = url.searchParams.get("id");

  if (!orderId) {
    return jsonResponse({ error: "ID de orden requerido." }, 400, request);
  }

  try {
    const deletedRows = (await sql`
      DELETE FROM orders WHERE id = ${orderId} RETURNING id
    `) as Array<{ id: string }>;

    if (deletedRows.length === 0) {
      return jsonResponse({ error: "Orden no encontrada." }, 404, request);
    }

    return jsonResponse(
      {
        message: "Orden eliminada correctamente.",
        deletedId: orderId,
      },
      200,
      request,
    );
  } catch (error) {
    console.error("Error deleting order:", error);
    return jsonResponse({ error: "Error al eliminar la orden." }, 500, request);
  }
}