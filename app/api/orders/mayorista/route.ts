import { sql } from "@/lib/db";
import { products } from "@/lib/catalog";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 16_384;
const MAX_ITEMS = 60;
const MAX_QUANTITY_PER_PRODUCT = 999;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;

const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

type IncomingOrder = {
  customer?: {
    name?: unknown;
    nif?: unknown;
    email?: unknown;
    address?: unknown;
    phone?: unknown;
    notes?: unknown;
  };
  items?: unknown;
};

type IncomingItem = {
  slug?: unknown;
  quantity?: unknown;
};

function jsonResponse(body: unknown, status = 200, request?: Request) {
  const headers: Record<string, string> = {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
  };

  if (request) {
    const origin = request.headers.get("origin");
    if (origin) headers["Access-Control-Allow-Origin"] = origin;
  }

  return Response.json(body, { status, headers });
}

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
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

// Spanish NIF (8 digits + letter) or CIF (letter + 7 digits + letter/digit).
function isValidNif(nif: string) {
  const normalized = nif.toUpperCase().replace(/[\s-]/g, "");
  return /^[0-9]{8}[A-Z]$/.test(normalized) || /^[A-Z][0-9]{7}[A-Z0-9]$/.test(normalized);
}

function isIncomingItem(item: unknown): item is IncomingItem {
  return typeof item === "object" && item !== null;
}

function getRequestIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}

function isRateLimited(request: Request) {
  const now = Date.now();
  const key = getRequestIp(request);
  const currentBucket = rateLimitBuckets.get(key);

  for (const [bucketKey, bucket] of rateLimitBuckets) {
    if (bucket.resetAt <= now) rateLimitBuckets.delete(bucketKey);
  }

  if (!currentBucket || currentBucket.resetAt <= now) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  currentBucket.count += 1;
  return currentBucket.count > RATE_LIMIT_MAX_REQUESTS;
}

async function readLimitedJson<T = unknown>(request: Request): Promise<T> {
  const contentLength = request.headers.get("content-length");

  if (contentLength && Number(contentLength) > MAX_BODY_BYTES) {
    throw new Error("BODY_TOO_LARGE");
  }

  if (!request.body) throw new Error("EMPTY_BODY");

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let receivedBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    receivedBytes += value.byteLength;
    if (receivedBytes > MAX_BODY_BYTES) throw new Error("BODY_TOO_LARGE");

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
    name: cleanText(payload.customer?.name, 120),
    nif: cleanText(payload.customer?.nif, 20).toUpperCase(),
    email: cleanText(payload.customer?.email, 120).toLowerCase(),
    address: cleanText(payload.customer?.address, 200),
    phone: cleanText(payload.customer?.phone, 40),
    notes: cleanText(payload.customer?.notes, 800),
  };

  if (customer.name.length < 2) {
    return jsonResponse({ error: "Indica el nombre de la empresa." }, 400, request);
  }

  if (!isValidNif(customer.nif)) {
    return jsonResponse({ error: "Indica un NIF/CIF valido." }, 400, request);
  }

  if (!isValidEmail(customer.email)) {
    return jsonResponse({ error: "Indica un email valido." }, 400, request);
  }

  if (customer.address.length < 5) {
    return jsonResponse({ error: "Indica una direccion valida." }, 400, request);
  }

  if (customer.phone.length < 6) {
    return jsonResponse({ error: "Indica un telefono valido." }, 400, request);
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
    const product = catalogBySlug.get(slug)!;
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
  const source = "web-cart-empresa";

  try {
    await sql`
      INSERT INTO mayorista (
        id, status, source,
        customer_name, custumer_nif, customer_email, custumer_address, customer_phone, customer_notes,
        items, total
      ) VALUES (
        ${id}, ${status}, ${source},
        ${customer.name}, ${customer.nif}, ${customer.email}, ${customer.address}, ${customer.phone}, ${customer.notes},
        ${JSON.stringify(items)}, ${total}
      )
    `;
  } catch (error) {
    console.error("Could not persist mayorista order", error);
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
