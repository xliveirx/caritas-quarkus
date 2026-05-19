import type { ApiErrorResponse } from '@/shared/types/api-error-response';

/**
 * No browser, usa URL relativa (/api/...) para aproveitar o rewrite do Next.js
 * que proxeia para o backend sem CORS.
 * No servidor (SSR), usa a URL interna diretamente.
 */
function getBaseUrl(): string {
  if (typeof window !== 'undefined') return '';
  return process.env.BACKEND_URL ?? 'http://localhost:8080';
}

async function request<T>(
  method: string,
  path: string,
  options?: { body?: unknown; token?: string }
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (options?.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const res = await fetch(`${getBaseUrl()}${path}`, {
    method,
    headers,
    body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: 'no-store',
  });

  if (!res.ok) {
    const error: ApiErrorResponse = await res
      .json()
      .catch(() => ({ title: 'Erro', message: 'Erro inesperado.', status: res.status }));
    if (res.status === 401 && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
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
