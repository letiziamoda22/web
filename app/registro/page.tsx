'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { GoogleButton } from '@/components/AuthButtons';
import { PageShell } from '@/components/site';

export default function RegistroPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    nifDni: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { refresh } = useAuth();

  const isPasswordMatch =
    form.password && form.confirmPassword && form.password === form.confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isPasswordMatch) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          nifDni: form.nifDni,
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al crear la cuenta');
        return;
      }

      await refresh();
      router.push('/');
    } catch (err) {
      setError('Error de red. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell headerTheme="light">
      <div className="max-w-md mx-auto mt-32 mb-16 p-6">
        <h1 className="text-2xl font-semibold mb-6">Crear cuenta</h1>

        <GoogleButton />

        <div className="flex items-center gap-2 my-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-sm text-gray-400">o</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Nombre"
            required
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            className="border rounded-lg px-3 py-2"
          />

          <input
            type="email"
            placeholder="Email"
            required
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            className="border rounded-lg px-3 py-2"
          />

          <input
            type="tel"
            placeholder="Teléfono"
            required
            value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
            className="border rounded-lg px-3 py-2"
          />

          <input
            type="text"
            placeholder="DNI / NIF"
            required
            value={form.nifDni}
            onChange={e =>
              setForm({ ...form, nifDni: e.target.value.toUpperCase() })
            }
            className="border rounded-lg px-3 py-2"
          />

          <input
            type="password"
            placeholder="Contraseña"
            required
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            className={`border rounded-lg px-3 py-2 ${
              form.confirmPassword && !isPasswordMatch ? 'border-red-500' : ''
            }`}
          />

          <input
            type="password"
            placeholder="Confirmar contraseña"
            required
            value={form.confirmPassword}
            onChange={e =>
              setForm({ ...form, confirmPassword: e.target.value })
            }
            className={`border rounded-lg px-3 py-2 ${
              form.confirmPassword && !isPasswordMatch ? 'border-red-500' : ''
            }`}
          />

          {form.confirmPassword && !isPasswordMatch && (
            <p className="text-red-500 text-sm">
              Las contraseñas no coinciden
            </p>
          )}

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            disabled={loading || !isPasswordMatch}
            className="bg-black text-white rounded-lg py-2 hover:bg-gray-800 transition disabled:opacity-50"
          >
            {loading ? 'Creando...' : 'Crear cuenta'}
          </button>
        </form>
      </div>
    </PageShell>
  );
}