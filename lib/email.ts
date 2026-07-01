import nodemailer from "nodemailer";

export type PaidOrderEmailPayload = {
  id: string;
  createdAt?: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    notes?: string;
    nif?: string;
    address?: string;
  };
  items: Array<{
    name: string;
    color?: string;
    description?: string;
    quantity: number;
    lineTotal: number;
  }>;
  total: number;
};

const NOTIFY_EMAIL = process.env.TANNA_EMAIL ?? process.env.GMAIL_USER ?? "letiziamoda22@gmail.com";

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

function formatItems(items: PaidOrderEmailPayload["items"]) {
  return items
    .map((item) => {
      const parts = [`${item.quantity}× ${item.name}`];
      if (item.color) parts.push(`Color: ${item.color}`);
      if (item.description) parts.push(`Desc: ${item.description}`);
      parts.push(`Total: ${item.lineTotal.toFixed(2)}€`);
      return parts.join(" | ");
    })
    .join("\n");
}

export async function sendPaidOrderEmail({
  order,
  orderType,
}: {
  order: PaidOrderEmailPayload;
  orderType: "individual" | "mayorista";
}) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn("GMAIL_USER/GMAIL_APP_PASSWORD not configured, skipping paid-order email");
    return;
  }

  const subject = orderType === "mayorista"
    ? `Pedido mayorista pagado - ${order.id}`
    : `Nuevo pedido pagado - ${order.id}`;

  const customerLine = order.customer.nif
    ? `Cliente: ${order.customer.name} (${order.customer.nif})`
    : `Cliente: ${order.customer.name}`;

  const text = [
    `Pedido pagado en Tanna`,
    `ID: ${order.id}`,
    customerLine,
    `Email: ${order.customer.email}`,
    `Teléfono: ${order.customer.phone}`,
    `Dirección: ${order.customer.address ?? "-"}`,
    `Notas: ${order.customer.notes ?? "-"}`,
    "",
    "Productos:",
    formatItems(order.items),
    "",
    `Total: ${order.total.toFixed(2)}€`,
  ].join("\n");

  const html = `
    <h2>Pedido pagado en Tanna</h2>
    <p><strong>ID:</strong> ${order.id}</p>
    <p><strong>${customerLine}</strong></p>
    <p><strong>Email:</strong> ${order.customer.email}</p>
    <p><strong>Teléfono:</strong> ${order.customer.phone}</p>
    <p><strong>Dirección:</strong> ${order.customer.address ?? "-"}</p>
    <p><strong>Notas:</strong> ${order.customer.notes ?? "-"}</p>
    <h3>Productos</h3>
    <pre style="font-family: inherit; white-space: pre-wrap;">${formatItems(order.items)}</pre>
    <p><strong>Total:</strong> ${order.total.toFixed(2)}€</p>
  `;

  await getTransporter().sendMail({
    from: `Tanna Web <${process.env.GMAIL_USER}>`,
    to: NOTIFY_EMAIL,
    subject,
    text,
    html,
  });
}
