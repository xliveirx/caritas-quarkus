'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';

import type { AuthContextValue } from '@/shared/types/auth-context-value';
import type { AuthUser } from '@/shared/types/auth-user';
import type { DecodedToken } from '@/shared/types/decoded-token';
import type { LoginRequest } from '@/shared/types/login-request';
import type { LoginResponse } from '@/shared/types/login-response';
import { api } from '@/services/api';
import { useToast } from '@/contexts/toast-context';

const ACCESS_TOKEN_KEY  = 'caritas:token';
const REFRESH_TOKEN_KEY = 'caritas:refresh-token';

function decodeToken(token: string): DecodedToken | null {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as DecodedToken;
  } catch {
    return null;
  }
}

function tokenToUser(token: string): AuthUser | null {
  const decoded = decodeToken(token);
  if (!decoded) return null;
  if (decoded.exp * 1000 < Date.now()) return null;
  const email = decoded.upn ?? decoded.sub;
  if (!email) return null;
  return {
    email,
    roles: (decoded.groups ?? []) as AuthUser['roles'],
    parishId: decoded.parish,
  };
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const toast = useToast();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount — try refresh if access token is expired
  useEffect(() => {
    const stored = localStorage.getItem(ACCESS_TOKEN_KEY);

    if (!stored) {
      setIsLoading(false);
      return;
    }

    const resolvedUser = tokenToUser(stored);
    if (resolvedUser) {
      setToken(stored);
      setUser(resolvedUser);
      setIsLoading(false);
      return;
    }

    // Access token expired — try to silently refresh
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      setIsLoading(false);
      return;
    }

    fetch('/api/v1/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error();
        const data = await res.json() as { newAccessToken: string };
        const newUser = tokenToUser(data.newAccessToken);
        if (!newUser) throw new Error();
        localStorage.setItem(ACCESS_TOKEN_KEY, data.newAccessToken);
        setToken(data.newAccessToken);
        setUser(newUser);
      })
      .catch(() => {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
      })
      .finally(() => setIsLoading(false));
  }, []);

  // Forced logout when refresh also fails (dispatched from api.ts)
  useEffect(() => {
    const handler = () => {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      setToken(null);
      setUser(null);
      toast.error('Sessão expirada', 'Faça login novamente para continuar.');
      router.replace('/login');
    };
    window.addEventListener('auth:unauthorized', handler);
    return () => window.removeEventListener('auth:unauthorized', handler);
  }, [router, toast]);

  // Sync React state when api.ts silently refreshes the access token mid-request
  useEffect(() => {
    const handler = (e: Event) => {
      const newToken = (e as CustomEvent<string>).detail;
      const newUser = tokenToUser(newToken);
      if (newUser) {
        setToken(newToken);
        setUser(newUser);
      }
    };
    window.addEventListener('auth:token-refreshed', handler);
    return () => window.removeEventListener('auth:token-refreshed', handler);
  }, []);

  const login = useCallback(
    async (req: LoginRequest) => {
      const data = await api.post<LoginResponse>('/api/v1/auth/login', req);
      const resolvedUser = tokenToUser(data.token);
      if (!resolvedUser) throw new Error('Token inválido recebido do servidor.');
      localStorage.setItem(ACCESS_TOKEN_KEY, data.token);
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
      setToken(data.token);
      setUser(resolvedUser);
      router.push('/dashboard');
    },
    [router]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setToken(null);
    setUser(null);
    router.push('/login');
  }, [router]);

  return (
    <AuthContext.Provider
      value={{ user, token, isAuthenticated: !!user, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}
