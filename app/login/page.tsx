'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GoogleButton } from '@/components/AuthButtons';
import { useAuth } from '@/context/AuthContext';
import { PageShell } from '@/components/site';

function LoginForm() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    const res = await fetch('/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    await refresh();
    router.push(searchParams.get('redirect') || '/');
  };

  return (
    <div className="max-w-md mx-auto mt-32 mb-16 p-6">
      <h1 className="text-2xl font-semibold mb-6">Iniciar sesión</h1>
      <GoogleButton />
      <div className="flex items-center gap-2 my-4">
        <div className="flex-1 h-px bg-gray-200" /><span className="text-sm text-gray-400">o</span><div className="flex-1 h-px bg-gray-200" />
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input type="email" placeholder="Email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="border rounded-lg px-3 py-2" />
        <input type="password" placeholder="Contraseña" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="border rounded-lg px-3 py-2" />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button disabled={loading} className="bg-black text-white rounded-lg py-2 hover:bg-gray-800 transition disabled:opacity-50">
          {loading ? 'Entrando...' : 'Iniciar sesión'}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <PageShell headerTheme="light">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </PageShell>
  );
}