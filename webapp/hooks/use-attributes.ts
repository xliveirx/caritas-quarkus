'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/services/api';
import type { AttributeResponse, AttributeType } from '@/shared/types/attribute-response';
import type { PaginatedResponse } from '@/shared/types/paginated-response';

const TYPES: AttributeType[] = ['SIZE', 'CATEGORY', 'GENDER', 'CONDITION'];
const EMPTY: Record<AttributeType, AttributeResponse[]> = { SIZE: [], CATEGORY: [], GENDER: [], CONDITION: [] };

export function useAttributes() {
  const { token } = useAuth();
  const [attributes, setAttributes] = useState<Record<AttributeType, AttributeResponse[]>>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all(
      TYPES.map((type) =>
        api
          .get<PaginatedResponse<AttributeResponse>>(`/api/v1/attributes/${type}?page=0&size=200`, token)
          .then((res) => ({ type, items: res.data }))
      )
    )
      .then((results) => {
        const map = { ...EMPTY };
        results.forEach(({ type, items }) => { map[type] = items; });
        setAttributes(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  return { attributes, loading };
}
