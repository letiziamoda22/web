"use client";

import { FormEvent, useState } from "react";

type Order = {
  id: string;
  status: string;
  paymentStatus: string;
  stripeSessionId?: string | null;
  paidAt?: string | null;
  items?: Array<{
    slug: string;
    name: string;
    color?: string;
    description?: string;
    category: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }>;
  customer: {
    name: string;
    email: string;
    phone: string;
    notes: string;
    nif?: string;
    address?: string;
  };
};

interface Props {
  order: Order;
  onSubmit: (orderId: string, updates: unknown) => Promise<void>;
  onClose: () => void;
}

export default function AdminOrderForm({ order, onSubmit, onClose }: Props) {
  const isMayorista = order.customer.nif !== undefined;
  const isPaid = order.paymentStatus === "pagado";

  const [status, setStatus] = useState(order.status);
  const [name, setName] = useState(order.customer.name);
  const [nif, setNif] = useState(order.customer.nif ?? "");
  const [email, setEmail] = useState(order.customer.email);
  const [address, setAddress] = useState(order.customer.address ?? "");
  const [phone, setPhone] = useState(order.customer.phone);
  const [notes, setNotes] = useState(order.customer.notes);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    await onSubmit(order.id, {
      status,
      customer: isMayorista
        ? { name, nif, email, address, phone, notes }
        : { name, email, phone, notes },
    });

    setSaving(false);
  }

  return (
    <div className="rounded border border-[#e2ddd5] bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-xl font-semibold">
        Editar pedido {isMayorista ? "(empresa)" : ""}
      </h3>

      <div
        className={`mb-4 rounded border px-4 py-3 text-sm ${
          isPaid
            ? "border-[#9dcdb4] bg-[#f1faf5] text-[#1b5a3a]"
            : "border-[#e0c98f] bg-[#fdf7e9] text-[#8a6d1f]"
        }`}
      >
        <p className="font-semibold">{isPaid ? "Pago confirmado por Stripe" : "Pago pendiente"}</p>
        {isPaid && order.paidAt && (
          <p className="mt-1 text-xs">Fecha de pago: {new Date(order.paidAt).toLocaleString()}</p>
        )}
        {order.stripeSessionId && (
          <p className="mt-1 break-all text-xs opacity-75">Sesión Stripe: {order.stripeSessionId}</p>
        )}
        <p className="mt-2 text-xs opacity-75">
          Este estado se actualiza automáticamente desde Stripe y no se puede editar a mano.
        </p>
      </div>

      {order.items && order.items.length > 0 && (
        <div className="mb-4 rounded border border-[#e2ddd5] bg-[#fbfaf7] p-4">
          <h4 className="mb-2 text-sm font-semibold uppercase tracking-[0.14em] text-[#6b6259]">
            Productos del pedido
          </h4>
          <div className="space-y-2">
            {order.items.map((item, index) => (
              <div key={`${order.id}-${index}`} className="flex items-center justify-between gap-3 text-sm">
                <div>
                  <span className="block text-[#17130f]">
                    {item.quantity}× {item.name}
                    {item.color ? ` · ${item.color}` : ""}
                  </span>
                  {item.description && (
                    <span className="mt-1 block text-xs text-[#6b6259]">{item.description}</span>
                  )}
                </div>
                <span className="font-semibold text-[#d0513f]">${item.lineTotal.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-semibold mb-1">Estado del pedido</label>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="w-full rounded border border-[#cfc7bd] px-3 py-2 outline-none focus:border-[#d0513f]"
          >
            <option value="pending">pending</option>
            <option value="processing">processing</option>
            <option value="completed">completed</option>
            <option value="cancelled">cancelled</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">
            {isMayorista ? "Empresa" : "Cliente"}
          </label>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded border border-[#cfc7bd] px-3 py-2 outline-none focus:border-[#d0513f]"
          />
        </div>

        {isMayorista && (
          <div>
            <label className="block text-sm font-semibold mb-1">NIF/CIF</label>
            <input
              value={nif}
              onChange={(event) => setNif(event.target.value)}
              className="w-full rounded border border-[#cfc7bd] px-3 py-2 outline-none focus:border-[#d0513f]"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded border border-[#cfc7bd] px-3 py-2 outline-none focus:border-[#d0513f]"
          />
        </div>

        {isMayorista && (
          <div>
            <label className="block text-sm font-semibold mb-1">Dirección fiscal</label>
            <input
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              className="w-full rounded border border-[#cfc7bd] px-3 py-2 outline-none focus:border-[#d0513f]"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold mb-1">Teléfono</label>
          <input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="w-full rounded border border-[#cfc7bd] px-3 py-2 outline-none focus:border-[#d0513f]"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Notas</label>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            className="w-full rounded border border-[#cfc7bd] px-3 py-2 outline-none focus:border-[#d0513f]"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-[#d0513f] px-4 py-2 text-white hover:bg-[#17130f] disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-[#cfc7bd] bg-white px-4 py-2 text-[#17130f] hover:bg-[#f6f3ef]"
          >
            Cerrar
          </button>
        </div>
      </form>
    </div>
  );
}