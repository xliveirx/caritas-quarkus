import type { ApiErrorResponse } from '@/shared/types/api-error-response';

const ACCESS_TOKEN_KEY  = 'caritas:token';
const REFRESH_TOKEN_KEY = 'caritas:refresh-token';

function getBaseUrl(): string {
  if (typeof window !== 'undefined') return '';
  return process.env.BACKEND_URL ?? 'http://localhost:8080';
}

async function tryRefreshToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${getBaseUrl()}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;

    const data = await res.json() as { newAccessToken: string };
    localStorage.setItem(ACCESS_TOKEN_KEY, data.newAccessToken);
    window.dispatchEvent(new CustomEvent('auth:token-refreshed', { detail: data.newAccessToken }));
    return data.newAccessToken;
  } catch {
    return null;
  }
}

async function request<T>(
  method: string,
  path: string,
  options?: { body?: unknown; token?: string; _retry?: boolean },
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options?.token) headers['Authorization'] = `Bearer ${options.token}`;

  const res = await fetch(`${getBaseUrl()}${path}`, {
    method,
    headers,
    body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: 'no-store',
  });

  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined' && !options?._retry) {
      const newToken = await tryRefreshToken();
      if (newToken) {
        return request<T>(method, path, { ...options, token: newToken, _retry: true });
      }
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }

    const error: ApiErrorResponse = await res
      .json()
      .catch(() => ({ title: 'Erro', message: 'Erro inesperado.', status: res.status }));
    throw error;
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export const api = {
  post: <T>(path: string, body: unknown, token?: string) =>
    request<T>('POST', path, { body, token }),

  get: <T>(path: string, token?: string) =>
    request<T>('GET', path, { token }),

  patch: <T>(path: string, token?: string) =>
    request<T>('PATCH', path, { token }),

  put: <T>(path: string, body: unknown, token?: string) =>
    request<T>('PUT', path, { body, token }),

  delete: <T>(path: string, token?: string) =>
    request<T>('DELETE', path, { token }),
};
