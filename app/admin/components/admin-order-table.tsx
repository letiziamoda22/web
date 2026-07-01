"use client";

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

interface Props {
  orders: Order[];
  onSelect: (order: Order) => void;
  onDelete: (id: string) => void;
}

export default function AdminOrderTable({ orders, onSelect, onDelete }: Props) {
  if (orders.length === 0) {
    return <p className="text-sm text-[#6b6259]">No hay pedidos disponibles.</p>;
  }

  const showNif = orders.some((order) => order.customer.nif);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-[#e2ddd5] bg-[#fbfaf7] text-left text-xs uppercase tracking-[0.18em] text-[#6b6259]">
            <th className="px-4 py-3">ID</th>
            <th className="px-4 py-3">Cliente</th>
            {showNif && <th className="px-4 py-3">NIF/CIF</th>}
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Items</th>
            <th className="px-4 py-3">Total</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3">Pago</th>
            <th className="px-4 py-3">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const isPaid = order.paymentStatus === "pagado";
            return (
              <tr key={order.id} className="border-b border-[#e2ddd5] hover:bg-[#f9f6f0]">
                <td className="px-4 py-3 font-mono text-xs">{order.id.slice(0, 8)}...</td>
                <td className="px-4 py-3">{order.customer.name}</td>
                {showNif && <td className="px-4 py-3 text-xs">{order.customer.nif}</td>}
                <td className="px-4 py-3 text-xs">{order.customer.email}</td>
                <td className="px-4 py-3">{order.items.length}</td>
                <td className="px-4 py-3 font-semibold text-[#d0513f]">${order.total.toFixed(2)}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full border border-[#d0513f] px-2 py-1 text-xs text-[#d0513f]">
                    {order.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      isPaid
                        ? "border border-[#9dcdb4] bg-[#f1faf5] text-[#1b5a3a]"
                        : "border border-[#e0c98f] bg-[#fdf7e9] text-[#8a6d1f]"
                    }`}
                    title={order.paidAt ? `Pagado: ${new Date(order.paidAt).toLocaleString()}` : undefined}
                  >
                    {isPaid ? "Pagado" : "Pendiente"}
                  </span>
                </td>
                <td className="px-4 py-3 space-x-2">
                  <button
                    onClick={() => onSelect(order)}
                    className="text-sm font-semibold text-[#17130f] hover:text-[#d0513f]"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => onDelete(order.id)}
                    className="text-sm font-semibold text-[#d0513f] hover:text-[#17130f]"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}