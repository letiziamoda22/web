'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageShell } from '@/components/site';

function ExitoContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');

  return (
    <div className="max-w-md mx-auto mt-32 mb-16 p-6 text-center">
      <h1 className="text-2xl font-semibold mb-3">¡Gracias por tu pedido!</h1>
      <p className="text-[#6b6259] leading-7">
        Hemos recibido tu pago y estamos procesando tu pedido. Te enviaremos un email de confirmación en breve.
      </p>
      {orderId && (
        <p className="mt-4 text-sm text-[#7b7168]">
          Referencia del pedido: <span className="font-semibold">{orderId}</span>
        </p>
      )}
      
        href="/cuenta/pedidos"
        className="mt-6 inline-block bg-[#17130f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#d0513f]"
      <a>
        Ver mis pedidos
      </a>
    </div>
  );
}

export default function ExitoPage() {
  return (
    <PageShell headerTheme="light">
      <Suspense fallback={null}>
        <ExitoContent />
      </Suspense>
    </PageShell>
  );
}