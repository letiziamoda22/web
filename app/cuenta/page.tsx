'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { PageShell } from '@/components/site';

export default function CuentaPage() {
  const { user, loading, logout, refresh } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', phone: '', nifDni: '' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        nifDni: user.nifDni || '',
      });
    }
  }, [user]);

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
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        phone: form.phone,
        nifDni: form.nifDni,
      }),
    });
    setSaving(false);
    if (res.ok) {
      await refresh();
      setMsg('Guardado correctamente');
    } else {
      const data = await res.json().catch(() => ({}));
      setMsg(data.error || 'Error al guardar');
    }
  };

  const handleDeleteRequest = async () => {
    setDeleting(true);
    setMsg('');
    const res = await fetch('/api/auth/delete-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        phone: form.phone,
        nifDni: form.nifDni,
      }),
    });
    setDeleting(false);
    if (res.ok) {
      setMsg('Hemos recibido tu solicitud de eliminación. Te contactaremos por correo.');
    } else {
      const data = await res.json().catch(() => ({}));
      setMsg(data.error || 'No se pudo enviar la solicitud');
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
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 w-full border border-[#e2ddd5] px-3 py-2"
            />
          </div>
          <div>
            <label className="text-sm text-[#62584f]">Email</label>
            <input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-1 w-full border border-[#e2ddd5] px-3 py-2"
            />
          </div>
          <div>
            <label className="text-sm text-[#62584f]">Teléfono</label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="mt-1 w-full border border-[#e2ddd5] px-3 py-2"
            />
          </div>
          <div>
            <label className="text-sm text-[#62584f]">NIF / CIF</label>
            <input
              value={form.nifDni}
              onChange={(e) => setForm({ ...form, nifDni: e.target.value.toUpperCase() })}
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
            onClick={() => router.push('/cuenta/pedidos')}
            className="rounded border border-[#d0513f] bg-[#fff4f1] px-4 py-3 text-left text-sm font-semibold text-[#d0513f] transition hover:bg-[#ffe7de]"
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

        <div className="mt-6 border border-[#e2ddd5] bg-white p-6">
          <h2 className="text-lg font-semibold text-[#17130f]">Eliminar mi cuenta</h2>
          <p className="mt-2 text-sm text-[#7b7168]">
            Si lo deseas, enviaremos una solicitud de eliminación a nuestro correo para revisarla.
          </p>
          <button
            type="button"
            onClick={handleDeleteRequest}
            disabled={deleting}
            className="mt-4 rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? 'Enviando...' : 'Solicitar eliminación'}
          </button>
        </div>
      </div>
    </PageShell>
  );
}