'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import { api } from '@/services/api';
import { ParishFormModal } from '@/components/parish-form-modal';
import { ParishEditModal } from '@/components/parish-edit-modal';
import { SkeletonRow } from '@/components/ui/skeleton-row';
import { Pagination } from '@/components/ui/pagination';
import { ConfirmDeleteModal } from '@/components/ui/confirm-delete-modal';
import { maskCNPJ, formatDate } from '@/shared/utils/formatters';
import type { ParishResponse } from '@/shared/types/parish-response';
import type { PaginatedResponse } from '@/shared/types/paginated-response';
import type { ApiErrorResponse } from '@/shared/types/api-error-response';

const PAGE_SIZE = 10;

/* ─── Page ───────────────────────────────────────────────────────── */

export default function ParoquiasPage() {
  const { user, token } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const isAdmin = user?.roles.includes('ADMIN') ?? false;

  const [parishes, setParishes]           = useState<ParishResponse[]>([]);
  const [totalItems, setTotalItems]       = useState(0);
  const [totalPages, setTotalPages]       = useState(0);
  const [page, setPage]                   = useState(0);
  const [isLoading, setIsLoading]         = useState(true);
  const [modalOpen, setModalOpen]         = useState(false);
  const [editParishId, setEditParishId]   = useState<number | null>(null);
  const [parishToDelete, setParishToDelete] = useState<ParishResponse | null>(null);
  const [isDeleting, setIsDeleting]       = useState(false);

  /* ── Role guard ─────────────────────────────────────────────────── */
  useEffect(() => {
    if (user && !isAdmin) router.replace('/dashboard');
  }, [user, isAdmin, router]);

  /* ── Fetch ──────────────────────────────────────────────────────── */
  const fetchParishes = useCallback(
    async (currentPage: number) => {
      if (!token || !isAdmin) return;
      setIsLoading(true);
      try {
        const data = await api.get<PaginatedResponse<ParishResponse>>(
          `/api/v1/parishes?page=${currentPage}&size=${PAGE_SIZE}`,
          token
        );
        setParishes(data.data);
        setTotalItems(data.pagination.totalItems);
        setTotalPages(data.pagination.totalPages);
      } catch (err) {
        const apiErr = err as ApiErrorResponse;
        toast.error(apiErr?.title ?? 'Erro ao carregar paróquias', apiErr?.message);
      } finally {
        setIsLoading(false);
      }
    },
    [token, isAdmin, toast]
  );

  useEffect(() => { fetchParishes(page); }, [fetchParishes, page]);

  function handleCreated(parish: ParishResponse) {
    if (page === 0) {
      setParishes((prev) => [parish, ...prev.slice(0, PAGE_SIZE - 1)]);
      setTotalItems((n) => n + 1);
    } else {
      setPage(0);
    }
  }

  function handleUpdated(parish: ParishResponse) {
    setParishes((prev) => prev.map((p) => p.id === parish.id ? parish : p));
  }

  async function handleDelete() {
    if (!parishToDelete || !token) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/v1/parishes/${parishToDelete.id}`, token);
      toast.success('Paróquia excluída', `"${parishToDelete.name}" foi removida com sucesso.`);
      setParishes((prev) => prev.filter((p) => p.id !== parishToDelete.id));
      setTotalItems((n) => n - 1);
      setParishToDelete(null);
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      toast.error(apiErr?.title ?? 'Erro ao excluir paróquia', apiErr?.message);
    } finally {
      setIsDeleting(false);
    }
  }

  if (user && !isAdmin) return null;

  return (
    <>
      <div className="p-6 max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Paróquias</h1>
            <p className="text-sm text-slate-500 mt-0.5">Diocese de Caxias do Sul</p>
          </div>
          <div className="flex items-center gap-3">
            {!isLoading && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold
                bg-wine-50 text-wine-800 border border-wine-100">
                {totalItems} {totalItems === 1 ? 'paróquia' : 'paróquias'}
              </span>
            )}
            <button
              onClick={() => setModalOpen(true)}
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
              Nova paróquia
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {['Nome', 'CNPJ', 'Cidade / Estado', 'Endereço', 'Cadastro', ''].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold
                      text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonRow key={i} widths={[55, 35, 28, 60, 20, 8]} />)
                ) : parishes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 text-slate-300">
                          <line x1="12" y1="2" x2="12" y2="6" />
                          <line x1="10" y1="4" x2="14" y2="4" />
                          <path d="M5 10L12 6l7 4v10a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V10z" />
                          <rect x="9" y="14" width="6" height="8" />
                        </svg>
                        <p className="text-sm font-medium text-slate-500">Nenhuma paróquia cadastrada</p>
                        <button onClick={() => setModalOpen(true)}
                          className="text-xs text-wine-700 hover:text-wine-800 font-semibold underline underline-offset-2">
                          Cadastrar a primeira paróquia
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  parishes.map((parish) => (
                    <tr
                      key={parish.id}
                      onClick={() => router.push(`/paroquias/${parish.id}`)}
                      className="hover:bg-slate-50 transition-colors duration-100 cursor-pointer"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-wine-100 flex items-center
                            justify-center shrink-0">
                            <span className="text-wine-800 font-bold text-xs">
                              {parish.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium text-slate-900">{parish.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600 font-mono text-xs">
                        {maskCNPJ(parish.cnpj)}
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-medium text-slate-700">{parish.address.city}</span>
                        <span className="text-slate-400 mx-1">/</span>
                        <span className="text-slate-500">{parish.address.state}</span>
                      </td>
                      <td className="px-5 py-4 text-slate-500 max-w-[260px] truncate text-xs">
                        {parish.address.street}, {parish.address.number}
                        {parish.address.complement ? ` — ${parish.address.complement}` : ''}
                        {' · '}{parish.address.postalCode}
                      </td>
                      <td className="px-5 py-4 text-slate-500 text-xs whitespace-nowrap">
                        {formatDate(parish.createdAt)}
                      </td>
                      <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            type="button"
                            aria-label={`Editar ${parish.name}`}
                            onClick={() => setEditParishId(parish.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600
                              hover:bg-slate-100 transition-colors duration-150
                              focus:outline-none focus-visible:ring-2 focus-visible:ring-wine-700"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                              className="w-4 h-4">
                              <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
                              <path d="m15 5 4 4" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            aria-label={`Excluir ${parish.name}`}
                            onClick={() => setParishToDelete(parish)}
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
                  ))
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

      <ParishFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreated}
      />

      <ParishEditModal
        parishId={editParishId}
        onClose={() => setEditParishId(null)}
        onUpdated={(parish) => { handleUpdated(parish); setEditParishId(null); }}
      />

      {parishToDelete && (
        <ConfirmDeleteModal
          title="Excluir paróquia"
          description={<>Tem certeza que deseja excluir{' '}<span className="font-semibold text-slate-700">&ldquo;{parishToDelete.name}&rdquo;</span>? Esta ação não pode ser desfeita.</>}
          isPending={isDeleting}
          onConfirm={handleDelete}
          onCancel={() => setParishToDelete(null)}
        />
      )}
    </>
  );
}
