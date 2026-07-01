'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { PageShell } from '@/components/site';

export default function CompletarPerfilPage() {
  const { user, loading, refresh } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ phone: '', nifDni: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  if (loading) return null;
  if (!user) { router.push('/login'); return null; }
  if (!user.needsProfileCompletion) { router.push('/'); return null; }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSaving(true);
    const res = await fetch('/api/auth/complete-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error); return; }
    await refresh();
    router.push('/');
  };

  return (
    <PageShell headerTheme="light">
      <div className="max-w-md mx-auto mt-32 mb-16 p-6">
        <h1 className="text-2xl font-semibold mb-2">Completa tu perfil</h1>
        <p className="text-sm text-[#7b7168] mb-6">
          Necesitamos tu teléfono y DNI/NIF para poder facturar tus pedidos.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="tel" placeholder="Teléfono" required
            value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
            className="border rounded-lg px-3 py-2"
          />
          <input
            type="text" placeholder="DNI / NIF" required
            value={form.nifDni}
            onChange={e => setForm({ ...form, nifDni: e.target.value.toUpperCase() })}
            className="border rounded-lg px-3 py-2"
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button disabled={saving} className="bg-black text-white rounded-lg py-2 hover:bg-gray-800 transition disabled:opacity-50">
            {saving ? 'Guardando...' : 'Guardar y continuar'}
          </button>
        </form>
      </div>
    </PageShell>
  );
}