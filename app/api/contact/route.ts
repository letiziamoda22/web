import { sql } from "@/lib/db";
import nodemailer from "nodemailer";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 8_192;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 10;
const NOTIFY_EMAIL = "letiziamoda22@gmail.com";

const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }

  return transporter;
}

async function sendNotificationEmail(data: { id: string; name: string; contact: string; message: string }) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn("GMAIL_USER/GMAIL_APP_PASSWORD not configured, skipping email notification");
    return;
  }

  await getTransporter().sendMail({
    from: `Tanna Web <${process.env.GMAIL_USER}>`,
    to: NOTIFY_EMAIL,
    subject: `Nueva solicitud de contacto - ${data.name}`,
    text: [
      `ID: ${data.id}`,
      `Nombre: ${data.name}`,
      `Contacto: ${data.contact}`,
      "",
      "Mensaje:",
      data.message,
    ].join("\n"),
    html: `
      <h2>Nueva solicitud de contacto</h2>
      <p><strong>ID:</strong> ${data.id}</p>
      <p><strong>Nombre:</strong> ${data.name}</p>
      <p><strong>Contacto:</strong> ${data.contact}</p>
      <p><strong>Mensaje:</strong></p>
      <p>${data.message.replace(/\n/g, "<br>")}</p>
    `,
  });
}

function jsonResponse(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, maxLength);
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
  if (isRateLimited(request)) {
    return jsonResponse({ error: "Demasiadas solicitudes. Intentalo de nuevo en un minuto." }, 429);
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return jsonResponse({ error: "La solicitud debe enviarse como JSON." }, 415);
  }

  let payload: { name?: unknown; contact?: unknown; message?: unknown };

  try {
    payload = await readLimitedJson(request);
  } catch (error) {
    if (error instanceof Error && error.message === "BODY_TOO_LARGE") {
      return jsonResponse({ error: "El mensaje es demasiado grande." }, 413);
    }
    return jsonResponse({ error: "El cuerpo de la solicitud no es JSON valido." }, 400);
  }

  const name = cleanText(payload.name, 90);
  const contact = cleanText(payload.contact, 120);
  const message = cleanText(payload.message, 1000);

  if (name.length < 2) {
    return jsonResponse({ error: "Indica un nombre valido." }, 400);
  }

  if (contact.length < 5) {
    return jsonResponse({ error: "Indica un email o WhatsApp valido." }, 400);
  }

  if (message.length < 5) {
    return jsonResponse({ error: "Cuentanos un poco mas sobre la ocasion." }, 400);
  }

  const id = crypto.randomUUID();

  try {
    await sql`
      INSERT INTO contact_requests (id, name, contact_info, message)
      VALUES (${id}, ${name}, ${contact}, ${message})
    `;
  } catch (error) {
    console.error("Could not persist contact request", error);
    return jsonResponse({ error: "No se pudo enviar la solicitud." }, 500);
  }

  try {
    await sendNotificationEmail({ id, name, contact, message });
  } catch (error) {
    // The request is already saved in the DB — don't fail the response
    // just because the email notification didn't go out.
    console.error("Could not send contact notification email", error);
  }

  return jsonResponse({ requestId: id }, 201);
}