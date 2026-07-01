'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { PageShell } from '@/components/site';

export default function CuentaPage() {
  const { user, loading, logout, refresh } = useAuth();
  const router = useRouter();
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  if (loading) return null;

  if (!user) {
    router.push('/login');
    return null;
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    const res = await fetch('/api/auth/update-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    setSaving(false);
    if (res.ok) {
      await refresh();
      setMsg('Guardado correctamente');
    } else {
      setMsg('Error al guardar');
    }
  };

  return (
    <PageShell headerTheme="light">
      <div className="mx-auto max-w-2xl px-5 pt-32 pb-16 sm:px-8">
        <h1 className="text-3xl font-semibold text-[#17130f]">Mi cuenta</h1>
        <p className="mt-2 text-sm text-[#7b7168]">{user.email}</p>

        <form onSubmit={handleSave} className="mt-8 space-y-4 border border-[#e2ddd5] bg-white p-6">
          <h2 className="text-lg font-semibold">Datos personales</h2>
          <div>
            <label className="text-sm text-[#62584f]">Nombre</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full border border-[#e2ddd5] px-3 py-2"
            />
          </div>
          {msg && <p className="text-sm text-[#d0513f]">{msg}</p>}
          <button
            disabled={saving}
            className="bg-[#17130f] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#d0513f] disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>

        <div className="mt-6 flex flex-col gap-3 border border-[#e2ddd5] bg-white p-6">
          <h2 className="text-lg font-semibold">Otras opciones</h2>
          <button
            onClick={() => router.push('/cuenta/')}
            className="text-left text-sm text-[#17130f] hover:underline"
          >
            Ver mis pedidos
          </button>
          {user.hasPassword && (
            <button
              onClick={() => router.push('/cuenta/seguridad')}
              className="text-left text-sm text-[#17130f] hover:underline"
            >
              Cambiar contraseña
            </button>
          )}
          <button
            onClick={async () => { await logout(); router.push('/'); }}
            className="text-left text-sm text-red-600 hover:underline"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </PageShell>
  );
}