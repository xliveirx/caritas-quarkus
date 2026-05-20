'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import { api } from '@/services/api';
import { VolunteerModal } from '@/components/volunteer-modal';
import { SkeletonRow } from '@/components/ui/skeleton-row';
import { Pagination } from '@/components/ui/pagination';
import { StatusBadge } from '@/components/ui/status-badge';
import { ConfirmToggleModal } from '@/components/ui/confirm-toggle-modal';
import { ErrorState } from '@/components/ui/error-state';
import { formatDate } from '@/shared/utils/formatters';
import { getParishFromToken } from '@/shared/utils/token';
import type { VolunteerResponse } from '@/shared/types/volunteer-response';
import type { PaginatedResponse } from '@/shared/types/paginated-response';
import type { ApiErrorResponse } from '@/shared/types/api-error-response';

const PAGE_SIZE = 10;

/* ─── Page ───────────────────────────────────────────────────────── */

export default function VoluntariosPage() {
  const { user, token } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const isCoordinator = user?.roles.includes('COORDINATOR') ?? false;
  const parishId = token ? getParishFromToken(token) : null;

  const [volunteers, setVolunteers]       = useState<VolunteerResponse[]>([]);
  const [totalItems, setTotalItems]       = useState(0);
  const [totalPages, setTotalPages]       = useState(0);
  const [page, setPage]                   = useState(0);
  const [isLoading, setIsLoading]         = useState(true);
  const [fetchError, setFetchError]       = useState<{ title: string; message?: string } | null>(null);
  const [modalOpen, setModalOpen]           = useState(false);
  const [editVolunteer, setEditVolunteer]   = useState<VolunteerResponse | undefined>(undefined);
  const [loadingEditId, setLoadingEditId]   = useState<number | null>(null);
  const [togglingId, setTogglingId]         = useState<number | null>(null);
  const [volToToggle, setVolToToggle]       = useState<VolunteerResponse | null>(null);

  /* ── Role guard ─────────────────────────────────────────────────── */
  useEffect(() => {
    if (user && !isCoordinator) router.replace('/dashboard');
  }, [user, isCoordinator, router]);

  /* ── Fetch ──────────────────────────────────────────────────────── */
  const fetchVolunteers = useCallback(
    async (currentPage: number) => {
      if (!token || !parishId) return;
      setIsLoading(true);
      setFetchError(null);
      try {
        const data = await api.get<PaginatedResponse<VolunteerResponse>>(
          `/api/v1/volunteers/parish/${parishId}?page=${currentPage}&size=${PAGE_SIZE}`,
          token
        );
        setVolunteers(data.data);
        setTotalItems(data.pagination.totalItems);
        setTotalPages(data.pagination.totalPages);
      } catch (err) {
        const apiErr = err as ApiErrorResponse;
        setFetchError({
          title: apiErr?.title ?? 'Erro ao carregar voluntários',
          message: apiErr?.message,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [token, parishId]
  );

  useEffect(() => { fetchVolunteers(page); }, [fetchVolunteers, page]);

  /* ── Handlers ───────────────────────────────────────────────────── */

  async function handleToggle() {
    if (!volToToggle || !token) return;
    const vol = volToToggle;
    setTogglingId(vol.id);
    const action = vol.active ? 'deactivate' : 'activate';
    try {
      await api.patch(`/api/v1/volunteers/${action}/${vol.id}`, token);
      setVolunteers((prev) =>
        prev.map((v) => v.id === vol.id ? { ...v, active: !v.active } : v)
      );
      toast.success(
        vol.active ? 'Voluntário inativado' : 'Voluntário ativado',
        `"${vol.name}" foi ${vol.active ? 'inativado' : 'ativado'} com sucesso.`
      );
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      toast.error(apiErr?.title ?? 'Erro ao atualizar voluntário', apiErr?.message);
    } finally {
      setTogglingId(null);
      setVolToToggle(null);
    }
  }

  async function openEdit(vol: VolunteerResponse) {
    if (!token) return;
    setLoadingEditId(vol.id);
    try {
      const fresh = await api.get<VolunteerResponse>(`/api/v1/volunteers/${vol.id}`, token);
      setEditVolunteer(fresh);
      setModalOpen(true);
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      toast.error(apiErr?.title ?? 'Erro ao carregar voluntário', apiErr?.message);
    } finally {
      setLoadingEditId(null);
    }
  }

  function handleSaved(saved: VolunteerResponse) {
    if (editVolunteer) {
      setVolunteers((prev) => prev.map((v) => v.id === saved.id ? saved : v));
    } else {
      if (page === 0) {
        setVolunteers((prev) => [saved, ...prev.slice(0, PAGE_SIZE - 1)]);
        setTotalItems((n) => n + 1);
      } else {
        setPage(0);
      }
    }
    setEditVolunteer(undefined);
  }

  /* ── Guard ──────────────────────────────────────────────────────── */
  if (user && !isCoordinator) return null;

  /* ── Error state ────────────────────────────────────────────────── */
  if (!isLoading && fetchError) {
    return (
      <ErrorState
        title={fetchError.title}
        message={fetchError.message}
        onRetry={() => fetchVolunteers(page)}
      />
    );
  }

  return (
    <>
      <div className="p-6 max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Voluntários</h1>
            <p className="text-sm text-slate-500 mt-0.5">Voluntários da sua paróquia</p>
          </div>
          <div className="flex items-center gap-3">
            {!isLoading && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold
                bg-wine-50 text-wine-800 border border-wine-100">
                {totalItems} {totalItems === 1 ? 'voluntário' : 'voluntários'}
              </span>
            )}
            <button
              onClick={() => { setEditVolunteer(undefined); setModalOpen(true); }}
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
              Novo voluntário
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {['Nome', 'E-mail', 'Status', 'Cadastro', ''].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold
                      text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonRow key={i} widths={[55, 45, 20, 20]} />)
                ) : volunteers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 text-slate-300">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        <p className="text-sm font-medium text-slate-500">Nenhum voluntário cadastrado</p>
                        <button
                          onClick={() => { setEditVolunteer(undefined); setModalOpen(true); }}
                          className="text-xs text-wine-700 hover:text-wine-800 font-semibold underline underline-offset-2"
                        >
                          Cadastrar o primeiro voluntário
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  volunteers.map((vol) => (
                    <tr key={vol.id} className="hover:bg-slate-50 transition-colors duration-100">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center
                            justify-center shrink-0">
                            <span className="text-slate-600 font-bold text-xs">
                              {vol.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium text-slate-900">{vol.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600 text-xs">{vol.email}</td>
                      <td className="px-5 py-4"><StatusBadge active={vol.active} /></td>
                      <td className="px-5 py-4 text-slate-500 text-xs whitespace-nowrap">
                        {formatDate(vol.createdAt)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            type="button"
                            aria-label={`Editar ${vol.name}`}
                            onClick={() => openEdit(vol)}
                            disabled={!vol.active || loadingEditId === vol.id}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600
                              hover:bg-slate-100 transition-colors duration-150
                              focus:outline-none focus-visible:ring-2 focus-visible:ring-wine-700
                              disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {loadingEditId === vol.id ? (
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
                            aria-label={vol.active ? `Inativar ${vol.name}` : `Ativar ${vol.name}`}
                            onClick={() => setVolToToggle(vol)}
                            disabled={togglingId === vol.id}
                            title={vol.active ? 'Inativar' : 'Ativar'}
                            className={[
                              'p-1.5 rounded-lg transition-colors duration-150',
                              'focus:outline-none focus-visible:ring-2 focus-visible:ring-wine-700',
                              'disabled:opacity-50 disabled:cursor-not-allowed',
                              vol.active
                                ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50',
                            ].join(' ')}
                          >
                            {togglingId === vol.id ? (
                              <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                            ) : vol.active ? (
                              /* pause / deactivate icon */
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                className="w-4 h-4">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="10" y1="15" x2="10" y2="9" />
                                <line x1="14" y1="15" x2="14" y2="9" />
                              </svg>
                            ) : (
                              /* play / activate icon */
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                className="w-4 h-4">
                                <circle cx="12" cy="12" r="10" />
                                <polygon points="10 8 16 12 10 16 10 8" />
                              </svg>
                            )}
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

      <VolunteerModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditVolunteer(undefined); }}
        onSaved={handleSaved}
        volunteer={editVolunteer}
        isAdmin={false}
        lockedParishId={parishId ?? undefined}
      />

      {volToToggle && (
        <ConfirmToggleModal
          name={volToToggle.name}
          active={volToToggle.active}
          entityLabel="voluntário"
          isPending={togglingId === volToToggle.id}
          onConfirm={handleToggle}
          onCancel={() => setVolToToggle(null)}
        />
      )}
    </>
  );
}
