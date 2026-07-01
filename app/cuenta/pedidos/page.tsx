'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { PageShell } from '@/components/site';

type Order = {
  id: string;
  createdAt: string;
  status: string;
  paymentStatus: string;
  total: number;
  items: Array<{ name: string; color?: string; quantity: number; lineTotal: number }>;
};

export default function MisPedidosPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login?redirect=/cuenta/pedidos');
      return;
    }

    fetch('/api/orders/mine')
      .then((res) => res.json())
      .then((data) => setOrders(data.orders || []))
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  if (authLoading || loading) return null;

  return (
    <PageShell headerTheme="light">
      <div className="mx-auto max-w-3xl px-5 pt-32 pb-16 sm:px-8">
        <h1 className="text-3xl font-semibold text-[#17130f]">Mis pedidos</h1>

        {orders.length === 0 ? (
          <p className="mt-6 text-sm text-[#6b6259]">Todavía no tienes pedidos.</p>
        ) : (
          <div className="mt-8 space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="border border-[#e2ddd5] bg-white p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-[#17130f]">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      order.paymentStatus === 'pagado'
                        ? 'border border-[#9dcdb4] bg-[#f1faf5] text-[#1b5a3a]'
                        : 'border border-[#e0c98f] bg-[#fdf7e9] text-[#8a6d1f]'
                    }`}
                  >
                    {order.paymentStatus === 'pagado' ? 'Pagado' : 'Pendiente'}
                  </span>
                </div>
                <ul className="mt-3 space-y-1 text-sm text-[#6b6259]">
                  {order.items.map((item, i) => (
                    <li key={i}>
                      {item.quantity}× {item.name}{item.color ? ` (${item.color})` : ''}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-right font-semibold text-[#d0513f]">
                  ${order.total.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}