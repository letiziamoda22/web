'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';


type Variant = 'dark' | 'light';

export function GoogleButton() {
  return (
    <a href="/api/auth/google" className="flex items-center justify-center gap-2 w-full border border-gray-300 rounded-lg py-2 px-4 hover:bg-gray-50 transition">
      <svg width="18" height="18" viewBox="0 0 18 18">
        <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.84 2.08-1.79 2.72v2.26h2.9c1.7-1.56 2.69-3.87 2.69-6.62z"/>
        <path fill="#34A853" d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.9-2.26c-.8.55-1.84.86-3.06.86-2.35 0-4.34-1.58-5.05-3.72H.96v2.33C2.44 16.07 5.48 18 9 18z"/>
        <path fill="#FBBC05" d="M3.95 10.7c-.18-.55-.28-1.13-.28-1.7s.1-1.15.28-1.7V4.97H.96A8.98 8.98 0 000 9c0 1.45.35 2.83.96 4.03l2.99-2.33z"/>
        <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0 5.48 0 2.44 1.93.96 4.97l2.99 2.33C4.66 5.16 6.65 3.58 9 3.58z"/>
      </svg>
      Continuar con Google
    </a>
  );
}

export function RegisterButton({ variant = 'dark', className = '' }: { variant?: Variant; className?: string }) {
  const router = useRouter();
  const styles = variant === 'light'
    ? 'bg-[#17130f] text-white hover:bg-[#d0513f]'
    : 'bg-white text-[#17130f] hover:bg-[#d0513f] hover:text-white';
  return (
    <button onClick={() => router.push('/registro')} className={`rounded-lg py-2 px-4 transition ${styles} ${className}`}>
      Crear cuenta
    </button>
  );
}

export function LoginButton({ variant = 'dark', className = '' }: { variant?: Variant; className?: string }) {
  const router = useRouter();
  const styles = variant === 'light'
    ? 'text-[#17130f]/78 hover:text-[#17130f]'
    : 'text-white/78 hover:text-white';
  return (
    <button onClick={() => router.push('/login')} className={`rounded-lg py-2 px-4 transition ${styles} ${className}`}>
      Iniciar sesión
    </button>
  );
}

export function LogoutButton({ className = '' }: { className?: string }) {
  const { logout } = useAuth();
  const router = useRouter();
  return (
    <button onClick={async () => { await logout(); router.push('/'); }} className={`text-red-600 hover:underline ${className}`}>
      Cerrar sesión
    </button>
  );
}

export function AccountButton({ theme = 'dark' }: { theme?: 'dark' | 'light' }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const isLight = theme === 'light';

  if (loading) {
    return <div className={`h-9 w-9 animate-pulse rounded-full ${isLight ? 'bg-black/10' : 'bg-white/15'}`} />;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <LoginButton variant={theme} className="hidden text-sm sm:inline-flex" />
        <RegisterButton variant={theme} className="text-sm font-semibold" />
      </div>
    );
  }

  return (
    <button
      onClick={() => router.push('/cuenta')}
      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
        isLight
          ? 'border-black/15 text-[#17130f]/85 hover:border-black/30 hover:text-[#17130f]'
          : 'border-white/20 text-white/85 hover:border-white/40 hover:text-white'
      }`}
    >
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
          isLight ? 'bg-black/10 text-[#17130f]' : 'bg-white/15 text-white'
        }`}
      >
        {user.name?.charAt(0).toUpperCase() || 'U'}
      </span>
      <span className="hidden sm:inline">{user.name}</span>
    </button>
  );
}