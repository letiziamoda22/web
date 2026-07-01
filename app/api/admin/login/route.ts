import { NextResponse } from "next/server";

export const runtime = "nodejs";

function jsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, { status });
}

const expectedUser = process.env.ADMIN_USER;
const expectedPassword = process.env.ADMIN_PASSWORD;

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.toLowerCase().startsWith("application/json")) {
    return jsonResponse({ error: "La solicitud debe enviarse como JSON." }, 415);
  }

  const body = await request.json();
  const username = String(body.username ?? "");
  const password = String(body.password ?? "");

  if (!expectedUser || !expectedPassword) {
    return jsonResponse({ error: "Credenciales de administrador no configuradas." }, 500);
  }

  if (username !== expectedUser || password !== expectedPassword) {
    return jsonResponse({ error: "Usuario o contraseña incorrectos." }, 401);
  }

  const cookieValue = "1";
  const secure = process.env.NODE_ENV === "production";

  const response = NextResponse.json({ success: true });
  response.headers.set(
    "Set-Cookie",
    `tanna-admin-auth=${cookieValue}; Path=/; HttpOnly; SameSite=Lax${secure ? "; Secure" : ""}`,
  );

  return response;
}
