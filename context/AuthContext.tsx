'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface User {
  id: number;
  email: string;
  name: string;
  hasPassword: boolean;
  phone: string | null;
  nifDni: string | null;
  needsProfileCompletion: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    setUser(data.user);
    setLoading(false);
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  };

  useEffect(() => { refresh(); }, []);

  return <AuthContext.Provider value={{ user, loading, refresh, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}

