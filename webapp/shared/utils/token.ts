import type { DecodedToken } from '@/shared/types/decoded-token';

export function getParishFromToken(token: string): number | null {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const decoded = JSON.parse(json) as DecodedToken;
    return decoded.parish ?? null;
  } catch {
    return null;
  }
}
