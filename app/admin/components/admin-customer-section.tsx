"use client";

import { useState } from "react";
import AdminOrderTable from "./admin-order-table";

type Order = {
  id: string;
  createdAt: string;
  status: string;
  source: string;
  paymentStatus: string;
  stripeSessionId?: string | null;
  paidAt?: string | null;
  customer: {
    name: string;
    email: string;
    phone: string;
    notes: string;
    nif?: string;
    address?: string;
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

type CustomerSection = {
  customer: {
    name: string;
    email: string;
    phone: string;
    nif?: string;
    address?: string;
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

interface Props {
  section: CustomerSection;
  onSelectOrder: (order: Order) => void;
  onDeleteOrder: (id: string) => void;
  defaultOpen?: boolean;
}

export default function AdminCustomerSection({
  section,
  onSelectOrder,
  onDeleteOrder,
  defaultOpen = false,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const { customer, orderCount, totalSpent, orders, items } = section;

  const paidCount = orders.filter((o) => o.paymentStatus === "pagado").length;

  return (
    <div className="rounded border border-[#e2ddd5] bg-white">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full flex-col gap-2 px-6 py-4 text-left sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h3 className="text-lg font-semibold text-[#17130f]">{customer.name}</h3>
          <p className="text-xs text-[#6b6259]">
            {customer.email} · {customer.phone}
            {customer.nif ? ` · NIF: ${customer.nif}` : ""}
          </p>
          {customer.address && (
            <p className="mt-0.5 text-xs text-[#6b6259]">{customer.address}</p>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm">
          <span className="text-[#6b6259]">
            {orderCount} {orderCount === 1 ? "pedido" : "pedidos"}
          </span>
          <span className="text-xs text-[#1b5a3a]">
            {paidCount} pagado{paidCount === 1 ? "" : "s"}
          </span>
          <span className="font-semibold text-[#d0513f]">${totalSpent.toFixed(2)}</span>
          <span className="text-[#17130f]">{open ? "▲" : "▼"}</span>
        </div>
      </button>

      {open && (
        <div className="space-y-6 border-t border-[#e2ddd5] px-6 py-5">
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-[#6b6259]">
              Pedidos
            </h4>
            <AdminOrderTable orders={orders} onSelect={onSelectOrder} onDelete={onDeleteOrder} />
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-[#6b6259]">
              Prendas pedidas
            </h4>
            <div className="grid gap-2">
              {items.length === 0 ? (
                <p className="text-sm text-[#6b6259]">No hay prendas pedidas aún.</p>
              ) : (
                items.map((item) => (
                  <div
                    key={item.slug}
                    className="flex items-center justify-between rounded border border-[#e2ddd5] bg-[#fbfaf7] px-4 py-3"
                  >
                    <span className="text-sm text-[#17130f]">{item.name}</span>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-[#6b6259]">x{item.quantity}</span>
                      <span className="font-semibold text-[#d0513f]">${item.lineTotal.toFixed(2)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}