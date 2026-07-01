import { cookies } from "next/headers";
import {
  getMayoristaOrderById,
  getMayoristaOrdersGroupedByCustomer,
  updateMayoristaOrder,
  deleteMayoristaOrder,
} from "@/lib/mayorista-db";

export const runtime = "nodejs";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get("tanna-admin-auth")?.value === "1";
}

// One section per business customer, with their orders and a merged
// "prendas pedidas" list, same shape as /api/admin/orders but for mayorista.
export async function GET() {
  if (!(await isAuthenticated())) {
    return jsonResponse({ error: "No autorizado." }, 401);
  }

  const customers = await getMayoristaOrdersGroupedByCustomer();
  return jsonResponse({ customers }, 200);
}

export async function PUT(request: Request) {
  if (!(await isAuthenticated())) {
    return jsonResponse({ error: "No autorizado." }, 401);
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return jsonResponse({ error: "La solicitud debe enviarse como JSON." }, 415);
  }

  const payload = await request.json();
  const id = String(payload.id ?? "");
  const update = payload.update;

  if (!id) {
    return jsonResponse({ error: "ID de orden requerido." }, 400);
  }

  const existing = await getMayoristaOrderById(id);

  if (!existing) {
    return jsonResponse({ error: "Orden no encontrada." }, 404);
  }

  const fields: Parameters<typeof updateMayoristaOrder>[1] = {};

  if (update?.status && typeof update.status === "string") {
    fields.status = update.status;
  }

  if (update?.customer && typeof update.customer === "object") {
    const customer = update.customer;
    fields.customer = {};
    if (typeof customer.name === "string") fields.customer.name = customer.name;
    if (typeof customer.nif === "string") fields.customer.nif = customer.nif;
    if (typeof customer.email === "string") fields.customer.email = customer.email;
    if (typeof customer.address === "string") fields.customer.address = customer.address;
    if (typeof customer.phone === "string") fields.customer.phone = customer.phone;
    if (typeof customer.notes === "string") fields.customer.notes = customer.notes;
  }

  const order = await updateMayoristaOrder(id, fields);
  return jsonResponse({ order }, 200);
}

export async function DELETE(request: Request) {
  if (!(await isAuthenticated())) {
    return jsonResponse({ error: "No autorizado." }, 401);
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return jsonResponse({ error: "ID de orden requerido." }, 400);
  }

  const deleted = await deleteMayoristaOrder(id);

  if (!deleted) {
    return jsonResponse({ error: "Orden no encontrada." }, 404);
  }

  return jsonResponse({ message: "Orden eliminada." }, 200);
}
