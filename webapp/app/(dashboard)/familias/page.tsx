'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import { api } from '@/services/api';
import { FamilyModal } from '@/components/family-modal';
import { SkeletonRow } from '@/components/ui/skeleton-row';
import { Pagination } from '@/components/ui/pagination';
import { ConfirmDeleteModal } from '@/components/ui/confirm-delete-modal';
import { ErrorState } from '@/components/ui/error-state';
import { formatCPF, formatCurrency } from '@/shared/utils/formatters';
import type { FamilyResponse } from '@/shared/types/family-response';
import type { ParishResponse } from '@/shared/types/parish-response';
import type { PaginatedResponse } from '@/shared/types/paginated-response';
import type { ApiErrorResponse } from '@/shared/types/api-error-response';
import { SITUATION_LABELS, type Situation } from '@/shared/types/situation';

const PAGE_SIZE = 10;

/* ─── Situation Badge ────────────────────────────────────────────── */

const SITUATION_COLORS: Record<Situation, string> = {
  RISCO_BAIXO:       'bg-emerald-50 text-emerald-700 border border-emerald-100',
  RISCO_MEDIO:       'bg-amber-50 text-amber-700 border border-amber-100',
  RISCO_ALTO:        'bg-orange-50 text-orange-700 border border-orange-100',
  POBREZA_EXTREMA:   'bg-red-50 text-red-700 border border-red-100',
  EMERGENCIA_SOCIAL: 'bg-purple-50 text-purple-700 border border-purple-100',
};

function SituationBadge({ situation }: { situation: Situation }) {
  return (
    <span className={[
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold',
      SITUATION_COLORS[situation],
    ].join(' ')}>
      {SITUATION_LABELS[situation]}
    </span>
  );
}


/* ─── Page ───────────────────────────────────────────────────────── */

export default function FamiliasPage() {
  const { user, token } = useAuth();
  const toast = useToast();

  const isAdmin = user?.roles.includes('ADMIN') ?? false;

  const [families, setFamilies]           = useState<FamilyResponse[]>([]);
  const [totalItems, setTotalItems]       = useState(0);
  const [totalPages, setTotalPages]       = useState(0);
  const [page, setPage]                   = useState(0);
  const [isLoading, setIsLoading]         = useState(true);
  const [fetchError, setFetchError]       = useState<{ title: string; message?: string } | null>(null);
  const [parishes, setParishes]           = useState<ParishResponse[]>([]);
  const [modalOpen, setModalOpen]         = useState(false);
  const [editFamily, setEditFamily]       = useState<FamilyResponse | undefined>(undefined);
  const [loadingEditId, setLoadingEditId] = useState<number | null>(null);
  const [familyToDelete, setFamilyToDelete] = useState<FamilyResponse | null>(null);
  const [isDeleting, setIsDeleting]       = useState(false);

  /* ── Fetch parishes for ADMIN create ────────────────────────────── */
  useEffect(() => {
    if (!isAdmin || !token) return;
    api.get<PaginatedResponse<ParishResponse>>('/api/v1/parishes?page=0&size=100', token)
      .then((data) => setParishes(data.data))
      .catch(() => {});
  }, [isAdmin, token]);

  /* ── Fetch families ─────────────────────────────────────────────── */
  const fetchFamilies = useCallback(
    async (currentPage: number) => {
      if (!token) return;
      setIsLoading(true);
      setFetchError(null);
      try {
        const data = await api.get<PaginatedResponse<FamilyResponse>>(
          `/api/v1/families?page=${currentPage}&size=${PAGE_SIZE}`,
          token
        );
        setFamilies(data.data);
        setTotalItems(data.pagination.totalItems);
        setTotalPages(data.pagination.totalPages);
      } catch (err) {
        const apiErr = err as ApiErrorResponse;
        setFetchError({
          title: apiErr?.title ?? 'Erro ao carregar famílias',
          message: apiErr?.message,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [token]
  );

  useEffect(() => { fetchFamilies(page); }, [fetchFamilies, page]);

  /* ── Delete ─────────────────────────────────────────────────────── */
  async function handleDelete() {
    if (!familyToDelete || !token) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/v1/families/${familyToDelete.id}`, token);
      const responsible = familyToDelete.members.find((m) => m.responsible);
      toast.success('Família excluída', `Família de "${responsible?.name ?? 'N/A'}" foi removida.`);
      setFamilies((prev) => prev.filter((f) => f.id !== familyToDelete.id));
      setTotalItems((n) => n - 1);
      setFamilyToDelete(null);
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      toast.error(apiErr?.title ?? 'Erro ao excluir família', apiErr?.message);
    } finally {
      setIsDeleting(false);
    }
  }

  /* ── Open edit (fetch full data first) ─────────────────────────── */
  async function openEdit(family: FamilyResponse) {
    if (!token) return;
    setLoadingEditId(family.id);
    try {
      const full = await api.get<FamilyResponse>(`/api/v1/families/${family.id}`, token);
      setEditFamily(full);
      setModalOpen(true);
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      toast.error(apiErr?.title ?? 'Erro ao carregar família', apiErr?.message);
    } finally {
      setLoadingEditId(null);
    }
  }

  /* ── Saved ──────────────────────────────────────────────────────── */
  function handleSaved(saved: FamilyResponse) {
    if (editFamily) {
      setFamilies((prev) => prev.map((f) => f.id === saved.id ? saved : f));
    } else {
      if (page === 0) {
        setFamilies((prev) => [saved, ...prev.slice(0, PAGE_SIZE - 1)]);
        setTotalItems((n) => n + 1);
      } else {
        setPage(0);
      }
    }
    setEditFamily(undefined);
  }

  /* ── Error state ────────────────────────────────────────────────── */
  if (!isLoading && fetchError) {
    return (
      <ErrorState
        title={fetchError.title}
        message={fetchError.message}
        onRetry={() => fetchFamilies(page)}
      />
    );
  }

  return (
    <>
      <div className="p-6 max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Famílias</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {isAdmin ? 'Todas as famílias cadastradas' : 'Famílias da sua paróquia'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!isLoading && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold
                bg-wine-50 text-wine-800 border border-wine-100">
                {totalItems} {totalItems === 1 ? 'família' : 'famílias'}
              </span>
            )}
            <button
              onClick={() => { setEditFamily(undefined); setModalOpen(true); }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white
                bg-wine-800 hover:bg-wine-900 rounded-lg
                transition-colors duration-150
                focus:outline-none focus-visible:ring-2 focus-visible:ring-wine-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                className="w-4 h-4">
                <path d="M5 12h14M12 5v14" />
              </svg>
              Nova família
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {['Responsável', 'CPF', 'Situação', 'Renda mensal', 'Bolsa Família', 'Membros', ''].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold
                      text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonRow key={i} widths={[38, 22, 20, 18, 12, 8]} />)
                ) : families.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 text-slate-300">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                          <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                        <p className="text-sm font-medium text-slate-500">Nenhuma família cadastrada</p>
                        <button
                          onClick={() => { setEditFamily(undefined); setModalOpen(true); }}
                          className="text-xs text-wine-700 hover:text-wine-800 font-semibold underline underline-offset-2"
                        >
                          Cadastrar a primeira família
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  families.map((family) => {
                    const responsible = family.members.find((m) => m.responsible);
                    return (
                      <tr key={family.id} className="hover:bg-slate-50 transition-colors duration-100">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center
                              justify-center shrink-0">
                              <span className="text-slate-600 font-bold text-xs">
                                {responsible?.name.charAt(0).toUpperCase() ?? '?'}
                              </span>
                            </div>
                            <span className="font-medium text-slate-900">
                              {responsible?.name ?? '—'}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-500 text-xs font-mono">
                          {responsible?.cpf ? formatCPF(responsible.cpf) : '—'}
                        </td>
                        <td className="px-5 py-4">
                          <SituationBadge situation={family.situation} />
                        </td>
                        <td className="px-5 py-4 text-slate-700 text-sm">
                          {formatCurrency(family.monthlyIncome)}
                        </td>
                        <td className="px-5 py-4">
                          <span className={[
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border',
                            family.bolsaFamilia
                              ? 'bg-blue-50 text-blue-700 border-blue-100'
                              : 'bg-slate-100 text-slate-500 border-slate-200',
                          ].join(' ')}>
                            <span className={[
                              'w-1.5 h-1.5 rounded-full',
                              family.bolsaFamilia ? 'bg-blue-500' : 'bg-slate-400',
                            ].join(' ')} />
                            {family.bolsaFamilia ? 'Sim' : 'Não'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-600 text-sm">
                          {family.members.length}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1 justify-end">
                            <button
                              type="button"
                              aria-label={`Editar família de ${responsible?.name ?? ''}`}
                              onClick={() => openEdit(family)}
                              disabled={loadingEditId === family.id}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600
                                hover:bg-slate-100 transition-colors duration-150
                                focus:outline-none focus-visible:ring-2 focus-visible:ring-wine-700
                                disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {loadingEditId === family.id ? (
                                <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                  className="w-4 h-4">
                                  <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
                                  <path d="m15 5 4 4" />
                                </svg>
                              )}
                            </button>
                            <button
                              type="button"
                              aria-label={`Excluir família de ${responsible?.name ?? ''}`}
                              onClick={() => setFamilyToDelete(family)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600
                                hover:bg-red-50 transition-colors duration-150
                                focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                className="w-4 h-4">
                                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                                <path d="M10 11v6M14 11v6" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            page={page} totalPages={totalPages}
            totalItems={totalItems} pageSize={PAGE_SIZE}
            onPage={setPage}
          />
        </div>
      </div>

      <FamilyModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditFamily(undefined); }}
        onSaved={handleSaved}
        family={editFamily}
        parishes={parishes}
        isAdmin={isAdmin}
      />

      {familyToDelete && (
        <ConfirmDeleteModal
          title="Excluir família"
          description={<>Tem certeza que deseja excluir a família de{' '}<span className="font-semibold text-slate-700">&ldquo;{familyToDelete.members.find((m) => m.responsible)?.name ?? 'N/A'}&rdquo;</span>? Esta ação não pode ser desfeita.</>}
          isPending={isDeleting}
          onConfirm={handleDelete}
          onCancel={() => setFamilyToDelete(null)}
        />
      )}
    </>
  );
}
