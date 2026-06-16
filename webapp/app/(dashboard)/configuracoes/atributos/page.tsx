'use client';

import { useState, useEffect, useRef, type FormEvent } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import { api } from '@/services/api';
import { ErrorState } from '@/components/ui/error-state';
import type { PaginatedResponse } from '@/shared/types/paginated-response';
import type { AttributeResponse, AttributeType } from '@/shared/types/attribute-response';
import type { ApiErrorResponse } from '@/shared/types/api-error-response';

/* ─── Constants ──────────────────────────────────────────────────── */

const ATTRIBUTE_TYPES: AttributeType[] = ['SIZE', 'CATEGORY', 'GENDER', 'CONDITION'];

const TYPE_META: Record<AttributeType, { label: string; singular: string; placeholder: string }> = {
  SIZE:      { label: 'Tamanho',   singular: 'tamanho',   placeholder: 'Ex: P, M, G, GG…' },
  CATEGORY:  { label: 'Categoria', singular: 'categoria', placeholder: 'Ex: Roupa, Calçado…' },
  GENDER:    { label: 'Gênero',    singular: 'gênero',    placeholder: 'Ex: Masculino, Feminino…' },
  CONDITION: { label: 'Condição',  singular: 'condição',  placeholder: 'Ex: Novo, Usado…' },
};

/* ─── Column ─────────────────────────────────────────────────────── */

interface ColumnProps {
  type: AttributeType;
  items: AttributeResponse[];
  loading: boolean;
  deletingId: number | null;
  reorderingType: AttributeType | null;
  onAdd: (type: AttributeType, label: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onMove: (type: AttributeType, fromIndex: number, toIndex: number) => Promise<void>;
}

function TypeColumn({ type, items, loading, deletingId, reorderingType, onAdd, onDelete, onMove }: ColumnProps) {
  const meta = TYPE_META[type];
  const [newLabel, setNewLabel] = useState('');
  const [adding, setAdding]     = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isReordering = reorderingType === type;

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    const label = newLabel.trim();
    if (!label || adding) return;
    setAdding(true);
    try {
      await onAdd(type, label);
      setNewLabel('');
    } catch {
      // handled by parent
    } finally {
      setAdding(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <h2 className="text-sm font-bold text-slate-800">{meta.label}</h2>
          {!loading && items.length > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px]
              font-bold bg-wine-50 text-wine-700">
              {items.length}
            </span>
          )}
        </div>
        {isReordering && (
          <svg className="animate-spin w-3.5 h-3.5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto max-h-96">
        {loading ? (
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                <div className="w-4 h-4 rounded bg-slate-100 animate-pulse shrink-0" />
                <div
                  className="h-3 rounded-full bg-slate-100 animate-pulse"
                  style={{ width: `${40 + i * 13}%` }}
                />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                className="w-5 h-5 text-slate-400">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-500">Nenhum {meta.singular}</p>
            <p className="text-xs text-slate-400 mt-0.5">Adicione um abaixo para começar</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((attr, i) => (
              <div
                key={attr.id}
                className="group flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors duration-100"
              >
                {/* Drag-handle dots — visual affordance for reorderability */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 8 14"
                  className="w-2.5 h-3.5 shrink-0 text-slate-300 group-hover:text-slate-400
                    transition-colors duration-100 cursor-grab"
                  aria-hidden="true"
                >
                  <circle cx="2" cy="2"  r="1.2" fill="currentColor" />
                  <circle cx="6" cy="2"  r="1.2" fill="currentColor" />
                  <circle cx="2" cy="7"  r="1.2" fill="currentColor" />
                  <circle cx="6" cy="7"  r="1.2" fill="currentColor" />
                  <circle cx="2" cy="12" r="1.2" fill="currentColor" />
                  <circle cx="6" cy="12" r="1.2" fill="currentColor" />
                </svg>

                {/* Label */}
                <span className="flex-1 text-sm font-medium text-slate-800 leading-tight select-none">
                  {attr.label}
                </span>

                {/* Actions — visible on hover */}
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">

                  {/* Move up/down pill */}
                  <div className="flex items-stretch rounded-lg border border-slate-200 overflow-hidden bg-white">
                    <button
                      type="button"
                      onClick={() => onMove(type, i, i - 1)}
                      disabled={i === 0 || isReordering || !!deletingId}
                      aria-label="Mover para cima"
                      className="flex items-center justify-center w-7 h-7 text-slate-400
                        hover:text-slate-700 hover:bg-slate-100 transition-colors
                        border-r border-slate-200
                        disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-400"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                        className="w-3 h-3">
                        <path d="m18 15-6-6-6 6" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => onMove(type, i, i + 1)}
                      disabled={i === items.length - 1 || isReordering || !!deletingId}
                      aria-label="Mover para baixo"
                      className="flex items-center justify-center w-7 h-7 text-slate-400
                        hover:text-slate-700 hover:bg-slate-100 transition-colors
                        disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-400"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                        className="w-3 h-3">
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </button>
                  </div>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => onDelete(attr.id)}
                    disabled={deletingId === attr.id || isReordering}
                    aria-label={`Excluir ${attr.label}`}
                    className="flex items-center justify-center w-7 h-7 rounded-lg
                      text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors
                      disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {deletingId === attr.id ? (
                      <svg className="animate-spin w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        className="w-3.5 h-3.5">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add form */}
      <form
        onSubmit={handleAdd}
        className="flex items-center gap-2 px-4 py-3 border-t border-slate-100"
      >
        <input
          ref={inputRef}
          type="text"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder={meta.placeholder}
          disabled={adding || loading}
          maxLength={20}
          className="flex-1 min-w-0 text-sm px-3 py-2 rounded-lg border border-slate-200 bg-slate-50
            focus:bg-white focus:outline-none focus:ring-2 focus:ring-wine-800/20 focus:border-wine-600
            placeholder:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors duration-150"
        />
        <button
          type="submit"
          disabled={adding || loading || !newLabel.trim()}
          aria-label={`Adicionar ${meta.singular}`}
          className="shrink-0 flex items-center justify-center w-9 h-9 rounded-lg text-white
            bg-wine-800 hover:bg-wine-700 active:bg-wine-900 transition-colors duration-150
            focus:outline-none focus-visible:ring-2 focus-visible:ring-wine-700
            disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {adding ? (
            <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              className="w-4 h-4">
              <path d="M12 5v14M5 12h14" />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────── */

export default function AttributesPage() {
  const { token } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<AttributeType>('SIZE');
  const [data, setData] = useState<Record<AttributeType, AttributeResponse[]>>({
    SIZE: [], CATEGORY: [], GENDER: [], CONDITION: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<{ title: string; message?: string } | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [reorderingType, setReorderingType] = useState<AttributeType | null>(null);

  useEffect(() => {
    if (token) loadAll();
  }, [token]);

  async function loadAll() {
    setIsLoading(true);
    setFetchError(null);
    try {
      const results = await Promise.all(
        ATTRIBUTE_TYPES.map((type) =>
          api
            .get<PaginatedResponse<AttributeResponse>>(
              `/api/v1/attributes/${type}?page=0&size=200`,
              token!
            )
            .then((res) => ({ type, items: res.data }))
        )
      );
      setData((prev) => {
        const next = { ...prev };
        results.forEach(({ type, items }) => { next[type] = items; });
        return next;
      });
    } catch (err) {
      const e = err as ApiErrorResponse;
      setFetchError({ title: e?.title ?? 'Erro ao carregar atributos', message: e?.message });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAdd(type: AttributeType, label: string) {
    const attr = await api
      .post<AttributeResponse>('/api/v1/attributes', { type, label }, token!)
      .catch((err) => {
        const e = err as ApiErrorResponse;
        toast.error(e?.title ?? 'Erro ao criar atributo', e?.message);
        throw err;
      });

    setData((prev) => ({
      ...prev,
      [type]: [...prev[type], attr],
    }));
    toast.success('Atributo criado!', `"${label}" adicionado em ${TYPE_META[type].label}.`);
  }

  async function handleDelete(id: number) {
    const type = ATTRIBUTE_TYPES.find((t) => data[t].some((a) => a.id === id))!;
    const attr = data[type].find((a) => a.id === id);
    setDeletingId(id);
    try {
      await api.delete(`/api/v1/attributes/${id}`, token!);
      setData((prev) => ({
        ...prev,
        [type]: prev[type].filter((a) => a.id !== id),
      }));
      toast.success('Atributo removido!', `"${attr?.label}" foi excluído.`);
    } catch (err) {
      const e = err as ApiErrorResponse;
      toast.error(e?.title ?? 'Erro ao excluir atributo', e?.message);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleMove(type: AttributeType, fromIndex: number, toIndex: number) {
    if (toIndex < 0 || toIndex >= data[type].length) return;

    const reordered = [...data[type]];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    // optimistic update
    setData((prev) => ({ ...prev, [type]: reordered }));
    setReorderingType(type);

    try {
      await api.put('/api/v1/attributes/reorder', { ids: reordered.map((a) => a.id) }, token!);
    } catch (err) {
      // revert on error
      setData((prev) => ({ ...prev, [type]: data[type] }));
      const e = err as ApiErrorResponse;
      toast.error(e?.title ?? 'Erro ao reordenar', e?.message);
    } finally {
      setReorderingType(null);
    }
  }

  if (!isLoading && fetchError) {
    return (
      <ErrorState
        title={fetchError.title}
        message={fetchError.message}
        onRetry={loadAll}
      />
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Atributos</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Valores utilizados na classificação de produtos e doações
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-slate-100 w-fit mb-6">
        {ATTRIBUTE_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setActiveTab(type)}
            className={[
              'px-5 py-2 text-sm font-semibold rounded-lg transition-colors duration-150',
              activeTab === type
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700',
            ].join(' ')}
          >
            {TYPE_META[type].label}
          </button>
        ))}
      </div>

      {/* Active tab content */}
      <div className="max-w-md">
        <TypeColumn
          key={activeTab}
          type={activeTab}
          items={data[activeTab]}
          loading={isLoading}
          deletingId={deletingId}
          reorderingType={reorderingType}
          onAdd={handleAdd}
          onDelete={handleDelete}
          onMove={handleMove}
        />
      </div>
    </div>
  );
}
