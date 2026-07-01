'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { PageShell } from '@/components/site';

export default function SeguridadPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  if (loading) return null;
  if (!user) { router.push('/login'); return null; }
  if (!user.hasPassword) { router.push('/cuenta'); return null; }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess(false);

    if (form.newPassword !== form.confirm) {
      setError('Las contraseñas nuevas no coinciden');
      return;
    }

    setSaving(true);
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) { setError(data.error); return; }
    setSuccess(true);
    setForm({ currentPassword: '', newPassword: '', confirm: '' });
  };

  return (
    <PageShell headerTheme="light">
      <div className="mx-auto max-w-md px-5 pt-32 pb-16 sm:px-8">
        <h1 className="text-3xl font-semibold text-[#17130f]">Cambiar contraseña</h1>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4 border border-[#e2ddd5] bg-white p-6">
          <input
            type="password" placeholder="Contraseña actual" required
            value={form.currentPassword}
            onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
            className="w-full border border-[#e2ddd5] px-3 py-2"
          />
          <input
            type="password" placeholder="Nueva contraseña" required
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            className="w-full border border-[#e2ddd5] px-3 py-2"
          />
          <input
            type="password" placeholder="Confirmar nueva contraseña" required
            value={form.confirm}
            onChange={(e) => setForm({ ...form, confirm: e.target.value })}
            className="w-full border border-[#e2ddd5] px-3 py-2"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">Contraseña actualizada. Se cerró sesión en otros dispositivos.</p>}
          <button
            disabled={saving}
            className="bg-[#17130f] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#d0513f] disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Actualizar contraseña'}
          </button>
        </form>
      </div>
    </PageShell>
  );
}