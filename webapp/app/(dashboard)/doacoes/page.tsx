'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import { api } from '@/services/api';
import { SkeletonRow } from '@/components/ui/skeleton-row';
import { Pagination } from '@/components/ui/pagination';
import { ConfirmDeleteModal } from '@/components/ui/confirm-delete-modal';
import { DonationEntryDrawer } from '@/components/donation-entry-drawer';
import { NewDonationEntryModal } from '@/components/new-donation-entry-modal';
import type { DonationEntrySummary } from '@/shared/types/donation-entry-summary';
import type { PaginatedResponse } from '@/shared/types/paginated-response';
import type { ApiErrorResponse } from '@/shared/types/api-error-response';

type Tab = 'entrada' | 'saida';

const PAGE_SIZE = 10;

function formatDate(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/* ─── Entrada Tab ────────────────────────────────────────────────── */

function EntradaTab() {
  const { token } = useAuth();
  const toast = useToast();

  const [entries, setEntries]         = useState<DonationEntrySummary[]>([]);
  const [totalItems, setTotalItems]   = useState(0);
  const [totalPages, setTotalPages]   = useState(0);
  const [page, setPage]               = useState(0);
  const [isLoading, setIsLoading]     = useState(true);
  const [fetchError, setFetchError]   = useState(false);
  const [drawerEntryId, setDrawerEntryId]     = useState<number | null>(null);
  const [modalOpen, setModalOpen]             = useState(false);
  const [entryToCancel, setEntryToCancel]     = useState<DonationEntrySummary | null>(null);
  const [isCancelling, setIsCancelling]       = useState(false);

  const fetchEntries = useCallback(async (currentPage: number) => {
    if (!token) return;
    setIsLoading(true);
    setFetchError(false);
    try {
      const data = await api.get<PaginatedResponse<DonationEntrySummary>>(
        `/api/v1/donations/entries?page=${currentPage}&size=${PAGE_SIZE}`,
        token
      );
      setEntries(data.data);
      setTotalItems(data.pagination.totalItems);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      if (apiErr?.status !== 401) {
        setFetchError(true);
        toast.error(apiErr?.title ?? 'Erro ao carregar entradas', apiErr?.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [token, toast]);

  useEffect(() => { fetchEntries(page); }, [fetchEntries, page]);

  async function handleCancel() {
    if (!entryToCancel || !token) return;
    setIsCancelling(true);
    try {
      await api.patch(`/api/v1/donations/entries/${entryToCancel.id}`, token);
      setEntries((prev) =>
        prev.map((e) => e.id === entryToCancel.id ? { ...e, status: 'CANCELED' as const } : e)
      );
      toast.success('Entrada cancelada', 'A entrada foi cancelada com sucesso.');
      setEntryToCancel(null);
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      toast.error(apiErr?.title ?? 'Erro ao cancelar entrada', apiErr?.message);
    } finally {
      setIsCancelling(false);
    }
  }

  function handleCreated(entry: DonationEntrySummary) {
    if (page === 0) {
      setEntries((prev) => [entry, ...prev.slice(0, PAGE_SIZE - 1)]);
      setTotalItems((n) => n + 1);
    } else {
      setPage(0);
    }
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 text-slate-300">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p className="text-sm font-medium text-slate-500">Não foi possível carregar as entradas.</p>
        <button onClick={() => fetchEntries(page)}
          className="text-xs font-semibold text-wine-700 hover:text-wine-800 underline underline-offset-2">
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Sub-header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {!isLoading && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold
              bg-wine-50 text-wine-800 border border-wine-100">
              {totalItems} {totalItems === 1 ? 'entrada' : 'entradas'}
            </span>
          )}
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white
            bg-wine-800 hover:bg-wine-900 rounded-lg transition-colors duration-150
            focus:outline-none focus-visible:ring-2 focus-visible:ring-wine-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            className="w-4 h-4"><path d="M5 12h14M12 5v14" /></svg>
          Registrar entrada
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {['Data', 'Doador', 'Paróquia', 'Observação', 'Status', ''].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold
                    text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <SkeletonRow key={i} widths={[18, 40, 35, 55, 16, 8]} />
                ))
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 text-slate-300">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                      <p className="text-sm font-medium text-slate-500">Nenhuma entrada registrada</p>
                      <button onClick={() => setModalOpen(true)}
                        className="text-xs text-wine-700 hover:text-wine-800 font-semibold underline underline-offset-2">
                        Registrar a primeira entrada
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr
                    key={entry.id}
                    onClick={() => setDrawerEntryId(entry.id)}
                    className="hover:bg-slate-50 transition-colors duration-100 cursor-pointer"
                  >
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md
                        bg-slate-100 text-slate-700 text-xs font-semibold font-mono">
                        {formatDate(entry.date)}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-800">
                      {entry.donator || <span className="text-slate-400 italic text-xs">Não informado</span>}
                    </td>
                    <td className="px-5 py-4 text-slate-600">{entry.parish.name}</td>
                    <td className="px-5 py-4 text-slate-500 max-w-[260px] truncate text-xs">
                      {entry.observation || <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-5 py-4">
                      {entry.status === 'CONFIRMED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full
                          text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Confirmada
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full
                          text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          Cancelada
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                      {entry.status === 'CONFIRMED' && (
                        <button
                          type="button"
                          aria-label="Cancelar entrada"
                          onClick={() => setEntryToCancel(entry)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600
                            hover:bg-amber-50 transition-colors duration-150
                            focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            className="w-4 h-4">
                            <circle cx="12" cy="12" r="10" />
                            <path d="m15 9-6 6M9 9l6 6" />
                          </svg>
                        </button>
                      )}
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

      <DonationEntryDrawer
        entryId={drawerEntryId}
        onClose={() => setDrawerEntryId(null)}
      />

      <NewDonationEntryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreated}
      />

      {entryToCancel && (
        <ConfirmDeleteModal
          title="Cancelar entrada"
          description={
            <>
              Tem certeza que deseja cancelar a entrada de{' '}
              <span className="font-semibold text-slate-700">
                &ldquo;{entryToCancel.donator ?? 'doador não informado'}&rdquo;
              </span>
              ? O estoque será revertido e esta ação não pode ser desfeita.
            </>
          }
          confirmLabel="Cancelar entrada"
          confirmClassName="bg-amber-600 hover:bg-amber-700 focus-visible:ring-amber-500"
          iconBg="bg-amber-100"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="w-5 h-5 text-amber-600">
              <circle cx="12" cy="12" r="10" />
              <path d="m15 9-6 6M9 9l6 6" />
            </svg>
          }
          isPending={isCancelling}
          onConfirm={handleCancel}
          onCancel={() => setEntryToCancel(null)}
        />
      )}
    </>
  );
}

/* ─── Saída Tab (placeholder) ────────────────────────────────────── */

function SaidaTab() {
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.5" className="w-7 h-7 text-slate-400">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-600">Saídas em breve</p>
        <p className="text-xs text-slate-400 mt-1">Esta funcionalidade ainda está em desenvolvimento.</p>
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────── */

export default function DoacoesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('entrada');

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Doações</h1>
        <p className="text-sm text-slate-500 mt-0.5">Registro de entradas e saídas de doações</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-slate-100 w-fit mb-6">
        {(['entrada', 'saida'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={[
              'px-5 py-2 text-sm font-semibold rounded-lg transition-colors duration-150',
              activeTab === tab
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700',
            ].join(' ')}
          >
            {tab === 'entrada' ? 'Entrada' : 'Saída'}
          </button>
        ))}
      </div>

      {activeTab === 'entrada' ? <EntradaTab /> : <SaidaTab />}
    </div>
  );
}
