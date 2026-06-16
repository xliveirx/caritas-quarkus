'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import { api } from '@/services/api';
import { SkeletonRow } from '@/components/ui/skeleton-row';
import { Pagination } from '@/components/ui/pagination';
import { ConfirmDeleteModal } from '@/components/ui/confirm-delete-modal';
import { DonationExitDrawer } from '@/components/donation-exit-drawer';
import { NewDonationExitModal } from '@/components/new-donation-exit-modal';
import { NewBazarSaleModal } from '@/components/new-bazar-sale-modal';
import { BazarSaleDrawer } from '@/components/bazar-sale-drawer';
import { generateBazarReceipt } from '@/lib/generate-bazar-receipt';
import type { DonationExitResponse } from '@/shared/types/donation-exit-response';
import type { FamilyResponse } from '@/shared/types/family-response';
import type { BazarSaleResponse } from '@/shared/types/bazar-sale-response';
import type { PaginatedResponse } from '@/shared/types/paginated-response';
import type { ApiErrorResponse } from '@/shared/types/api-error-response';
import { SearchBar } from '@/components/ui/search-bar';
import { FilterDropdown } from '@/components/ui/filter-dropdown';

type InnerTab = 'doacoes' | 'bazar';
type DonationStatus = 'CONFIRMED' | 'CANCELED';

const PAGE_SIZE = 10;

const STATUS_OPTIONS: { value: DonationStatus | ''; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'CONFIRMED', label: 'Confirmada' },
  { value: 'CANCELED', label: 'Cancelada' },
];

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function formatDate(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function getResponsible(family: FamilyResponse): string {
  return family.members.find((m) => m.responsible)?.name ?? `Família #${family.id}`;
}

/* ─── Doações Tab ────────────────────────────────────────────────── */

function DoacoesTab() {
  const { token, user } = useAuth();
  const isAdmin = user?.roles.includes('ADMIN') ?? false;
  const toast = useToast();

  const [exits, setExits]                   = useState<DonationExitResponse[]>([]);
  const [totalItems, setTotalItems]         = useState(0);
  const [totalPages, setTotalPages]         = useState(0);
  const [page, setPage]                     = useState(0);
  const [isLoading, setIsLoading]           = useState(true);
  const [fetchError, setFetchError]         = useState(false);
  const [drawerExit, setDrawerExit]         = useState<DonationExitResponse | null>(null);
  const [modalOpen, setModalOpen]           = useState(false);
  const [exitToCancel, setExitToCancel]     = useState<DonationExitResponse | null>(null);
  const [isCancelling, setIsCancelling]     = useState(false);

  const [searchInput, setSearchInput]   = useState('');
  const [search, setSearch]             = useState('');
  const [draftStatus, setDraftStatus]   = useState<DonationStatus | ''>('');
  const [status, setStatus]             = useState<DonationStatus | ''>('');
  const [openDropdown, setOpenDropdown] = useState<'status' | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openDropdown) return;
    function onMouseDown(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setOpenDropdown(null);
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [openDropdown]);

  const fetchExits = useCallback(async (currentPage: number) => {
    if (!token) return;
    setIsLoading(true);
    setFetchError(false);
    try {
      const qs = new URLSearchParams({ page: String(currentPage), size: String(PAGE_SIZE) });
      if (search) qs.set('search', search);
      if (status) qs.set('status', status);
      const data = await api.get<PaginatedResponse<DonationExitResponse>>(
        `/api/v1/donations/exits?${qs}`, token
      );
      setExits(data.data);
      setTotalItems(data.pagination.totalItems);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      if (apiErr?.status !== 401) setFetchError(true);
    } finally {
      setIsLoading(false);
    }
  }, [token, search, status]);

  useEffect(() => { fetchExits(page); }, [fetchExits, page]);

  function submitSearch() { setSearch(searchInput.trim()); setStatus(draftStatus); setPage(0); }
  function clearFilters() {
    setSearchInput(''); setSearch(''); setDraftStatus(''); setStatus(''); setPage(0);
  }

  async function handleCancel() {
    if (!exitToCancel || !token) return;
    setIsCancelling(true);
    try {
      await api.patch(`/api/v1/donations/exits/${exitToCancel.id}`, token);
      setExits((prev) => prev.map((e) =>
        e.id === exitToCancel.id ? { ...e, status: 'CANCELED' as const } : e
      ));
      toast.success('Saída cancelada', 'A saída foi cancelada com sucesso.');
      setExitToCancel(null);
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      toast.error(apiErr?.title ?? 'Erro ao cancelar saída', apiErr?.message);
    } finally {
      setIsCancelling(false);
    }
  }

  function handleCreated(exit: DonationExitResponse) {
    if (page === 0) {
      setExits((prev) => [exit, ...prev.slice(0, PAGE_SIZE - 1)]);
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
        <p className="text-sm font-medium text-slate-500">Não foi possível carregar as saídas.</p>
        <button onClick={() => fetchExits(page)}
          className="text-xs font-semibold text-wine-700 hover:text-wine-800 underline underline-offset-2">
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {!isLoading && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold
              bg-wine-50 text-wine-800 border border-wine-100">
              {totalItems} {totalItems === 1 ? 'saída' : 'saídas'}
            </span>
          )}
        </div>
        <button onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white
            bg-wine-800 hover:bg-wine-900 rounded-lg transition-colors duration-150
            focus:outline-none focus-visible:ring-2 focus-visible:ring-wine-700">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            className="w-4 h-4"><path d="M5 12h14M12 5v14" /></svg>
          Registrar saída
        </button>
      </div>

      <div className="mb-4 space-y-2.5">
        <SearchBar value={searchInput} onChange={setSearchInput} onSubmit={submitSearch}
          placeholder="Buscar por família..." />
        <div ref={filterRef} className="flex flex-wrap items-center gap-2">
          <FilterDropdown
            label="Status" value={draftStatus} options={STATUS_OPTIONS}
            isOpen={openDropdown === 'status'}
            onToggle={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}
            onSelect={(v) => { setDraftStatus(v as DonationStatus | ''); setOpenDropdown(null); }}
          />
          {(searchInput || draftStatus) && (
            <button type="button" onClick={clearFilters}
              className="text-xs font-semibold text-slate-400 hover:text-slate-600
                transition-colors duration-150 underline underline-offset-2">
              Limpar tudo
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {['Data', 'Família', ...(isAdmin ? ['Paróquia'] : []), 'Cesta', 'Observação', 'Status', ''].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold
                    text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <SkeletonRow key={i} widths={isAdmin ? [18, 35, 30, 30, 45, 16] : [18, 35, 30, 45, 16]} />
                ))
              ) : exits.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 text-slate-300">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                      <p className="text-sm font-medium text-slate-500">Nenhuma saída registrada</p>
                      <button onClick={() => setModalOpen(true)}
                        className="text-xs text-wine-700 hover:text-wine-800 font-semibold underline underline-offset-2">
                        Registrar a primeira saída
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                exits.map((exit) => (
                  <tr key={exit.id} onClick={() => setDrawerExit(exit)}
                    className="hover:bg-slate-50 transition-colors duration-100 cursor-pointer">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md
                        bg-slate-100 text-slate-700 text-xs font-semibold font-mono">
                        {formatDate(exit.date)}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-800">{getResponsible(exit.family)}</td>
                    {isAdmin && <td className="px-5 py-4 text-slate-600">{exit.parish.name}</td>}
                    <td className="px-5 py-4 text-slate-700 font-medium">{exit.kit.name}</td>
                    <td className="px-5 py-4 text-slate-500 max-w-[220px] truncate text-xs">
                      {exit.observation || <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-5 py-4">
                      {exit.status === 'CONFIRMED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full
                          text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Confirmada
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full
                          text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />Cancelada
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                      {exit.status === 'CONFIRMED' && (
                        <button type="button" aria-label="Cancelar saída"
                          onClick={() => setExitToCancel(exit)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600
                            hover:bg-amber-50 transition-colors duration-150">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            className="w-4 h-4">
                            <circle cx="12" cy="12" r="10" /><path d="m15 9-6 6M9 9l6 6" />
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
        <Pagination page={page} totalPages={totalPages} totalItems={totalItems}
          pageSize={PAGE_SIZE} onPage={setPage} />
      </div>

      <DonationExitDrawer exit={drawerExit} onClose={() => setDrawerExit(null)} />
      <NewDonationExitModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={handleCreated} />

      {exitToCancel && (
        <ConfirmDeleteModal
          title="Cancelar saída"
          description={
            <>
              Tem certeza que deseja cancelar a saída para a família{' '}
              <span className="font-semibold text-slate-700">
                &ldquo;{getResponsible(exitToCancel.family)}&rdquo;
              </span>? O estoque será revertido e esta ação não pode ser desfeita.
            </>
          }
          confirmLabel="Cancelar saída"
          confirmClassName="bg-amber-600 hover:bg-amber-700 focus-visible:ring-amber-500"
          iconBg="bg-amber-100"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="w-5 h-5 text-amber-600">
              <circle cx="12" cy="12" r="10" /><path d="m15 9-6 6M9 9l6 6" />
            </svg>
          }
          isPending={isCancelling}
          onConfirm={handleCancel}
          onCancel={() => setExitToCancel(null)}
        />
      )}
    </>
  );
}

/* ─── Bazar Tab ──────────────────────────────────────────────────── */

const dateInputClass = 'px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-wine-700/20 focus:border-wine-700 transition-colors duration-150';

function formatCpf(cpf: string): string {
  const d = cpf.replace(/\D/g, '');
  return d.length === 11 ? d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : cpf;
}

function BazarTab() {
  const { token, user } = useAuth();
  const isAdmin = user?.roles.includes('ADMIN') ?? false;

  const [sales, setSales]           = useState<BazarSaleResponse[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage]             = useState(0);
  const [isLoading, setIsLoading]   = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [modalOpen, setModalOpen]   = useState(false);
  const [drawerSale, setDrawerSale] = useState<BazarSaleResponse | null>(null);

  const [searchInput, setSearchInput]         = useState('');
  const [search, setSearch]                   = useState('');
  const [dateFrom, setDateFrom]               = useState('');
  const [dateTo, setDateTo]                   = useState('');
  const [minTotalInput, setMinTotalInput]     = useState('');
  const [maxTotalInput, setMaxTotalInput]     = useState('');
  const [appliedDateFrom, setAppliedDateFrom] = useState('');
  const [appliedDateTo, setAppliedDateTo]     = useState('');
  const [appliedMinTotal, setAppliedMinTotal] = useState('');
  const [appliedMaxTotal, setAppliedMaxTotal] = useState('');

  const fetchSales = useCallback(async (currentPage: number) => {
    if (!token) return;
    setIsLoading(true);
    setFetchError(false);
    try {
      const qs = new URLSearchParams({ page: String(currentPage), size: String(PAGE_SIZE) });
      if (search)           qs.set('search', search);
      if (appliedDateFrom)  qs.set('dateFrom', appliedDateFrom);
      if (appliedDateTo)    qs.set('dateTo', appliedDateTo);
      if (appliedMinTotal)  qs.set('minTotal', appliedMinTotal);
      if (appliedMaxTotal)  qs.set('maxTotal', appliedMaxTotal);
      const data = await api.get<PaginatedResponse<BazarSaleResponse>>(`/api/v1/bazar?${qs}`, token);
      setSales(data.data);
      setTotalItems(data.pagination.totalItems);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      if (apiErr?.status !== 401) setFetchError(true);
    } finally {
      setIsLoading(false);
    }
  }, [token, search, appliedDateFrom, appliedDateTo, appliedMinTotal, appliedMaxTotal]);

  useEffect(() => { fetchSales(page); }, [fetchSales, page]);

  function submitSearch() {
    setSearch(searchInput.trim());
    setAppliedDateFrom(dateFrom);
    setAppliedDateTo(dateTo);
    setAppliedMinTotal(minTotalInput.trim());
    setAppliedMaxTotal(maxTotalInput.trim());
    setPage(0);
  }

  function clearFilters() {
    setSearchInput(''); setSearch('');
    setDateFrom(''); setDateTo('');
    setMinTotalInput(''); setMaxTotalInput('');
    setAppliedDateFrom(''); setAppliedDateTo('');
    setAppliedMinTotal(''); setAppliedMaxTotal('');
    setPage(0);
  }

  function handleCreated(sale: BazarSaleResponse) {
    if (page === 0) {
      setSales((prev) => [sale, ...prev.slice(0, PAGE_SIZE - 1)]);
      setTotalItems((n) => n + 1);
    } else {
      setPage(0);
    }
  }

  const hasFilters = searchInput || dateFrom || dateTo || minTotalInput || maxTotalInput;

  if (fetchError) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 text-slate-300">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p className="text-sm font-medium text-slate-500">Não foi possível carregar as vendas.</p>
        <button onClick={() => fetchSales(page)}
          className="text-xs font-semibold text-wine-700 hover:text-wine-800 underline underline-offset-2">
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {!isLoading && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold
              bg-wine-50 text-wine-800 border border-wine-100">
              {totalItems} {totalItems === 1 ? 'venda' : 'vendas'}
            </span>
          )}
        </div>
        <button onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white
            bg-wine-800 hover:bg-wine-900 rounded-lg transition-colors duration-150
            focus:outline-none focus-visible:ring-2 focus-visible:ring-wine-700">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            className="w-4 h-4"><path d="M5 12h14M12 5v14" /></svg>
          Registrar venda
        </button>
      </div>

      {/* Search + filters */}
      <div className="mb-4 space-y-2.5">
        <SearchBar value={searchInput} onChange={setSearchInput} onSubmit={submitSearch}
          placeholder="Buscar por comprador ou CPF..." />
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-medium text-slate-500 whitespace-nowrap">De</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={dateInputClass} />
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-medium text-slate-500 whitespace-nowrap">até</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={dateInputClass} />
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-medium text-slate-500 whitespace-nowrap">R$ mín.</label>
            <input type="number" min={0} step="0.01" placeholder="0,00" value={minTotalInput}
              onChange={(e) => setMinTotalInput(e.target.value)}
              className={dateInputClass + ' w-24'} />
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-medium text-slate-500 whitespace-nowrap">R$ máx.</label>
            <input type="number" min={0} step="0.01" placeholder="0,00" value={maxTotalInput}
              onChange={(e) => setMaxTotalInput(e.target.value)}
              className={dateInputClass + ' w-24'} />
          </div>
          {hasFilters && (
            <button type="button" onClick={clearFilters}
              className="text-xs font-semibold text-slate-400 hover:text-slate-600
                transition-colors duration-150 underline underline-offset-2">
              Limpar tudo
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {['Data', 'Comprador', 'CPF', ...(isAdmin ? ['Paróquia'] : []), 'Itens', 'Total', ''].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold
                    text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <SkeletonRow key={i} widths={isAdmin ? [18, 40, 28, 30, 10, 20, 12] : [18, 40, 28, 10, 20, 12]} />
                ))
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 text-slate-300">
                        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <path d="M16 10a4 4 0 0 1-8 0" />
                      </svg>
                      <p className="text-sm font-medium text-slate-500">Nenhuma venda registrada</p>
                      <button onClick={() => setModalOpen(true)}
                        className="text-xs text-wine-700 hover:text-wine-800 font-semibold underline underline-offset-2">
                        Registrar a primeira venda
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale.id} onClick={() => setDrawerSale(sale)}
                    className="hover:bg-slate-50 transition-colors duration-100 cursor-pointer">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md
                        bg-slate-100 text-slate-700 text-xs font-semibold font-mono">
                        {formatDate(sale.soldAt)}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-800">{sale.buyerName}</td>
                    <td className="px-5 py-4 text-slate-600 text-sm">{formatCpf(sale.buyerCpf)}</td>
                    {isAdmin && <td className="px-5 py-4 text-slate-600 text-sm">{sale.parish.name}</td>}
                    <td className="px-5 py-4 text-slate-600 text-sm">
                      {sale.items.length} {sale.items.length === 1 ? 'item' : 'itens'}
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-800">{BRL.format(sale.total)}</td>
                    <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => generateBazarReceipt(sale)}
                        aria-label="Baixar recibo PDF"
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold
                          text-slate-600 border border-slate-200 rounded-lg
                          hover:border-slate-400 hover:text-slate-800
                          transition-colors duration-150 whitespace-nowrap"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                          className="w-3.5 h-3.5 shrink-0">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        PDF
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} totalItems={totalItems}
          pageSize={PAGE_SIZE} onPage={setPage} />
      </div>

      <BazarSaleDrawer sale={drawerSale} onClose={() => setDrawerSale(null)} />
      <NewBazarSaleModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={handleCreated} />
    </>
  );
}

/* ─── Page ───────────────────────────────────────────────────────── */

export default function SaidaPage() {
  const [activeTab, setActiveTab] = useState<InnerTab>('doacoes');

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Saída</h1>
        <p className="text-sm text-slate-500 mt-0.5">Registro de saídas de doações e vendas do bazar</p>
      </div>

      <div className="flex gap-1 p-1 rounded-xl bg-slate-100 w-fit mb-6">
        {([
          { value: 'doacoes', label: 'Doações' },
          { value: 'bazar',   label: 'Bazar/Brechó' },
        ] as { value: InnerTab; label: string }[]).map((tab) => (
          <button key={tab.value} onClick={() => setActiveTab(tab.value)}
            className={[
              'px-5 py-2 text-sm font-semibold rounded-lg transition-colors duration-150',
              activeTab === tab.value
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700',
            ].join(' ')}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'doacoes' ? <DoacoesTab /> : <BazarTab />}
    </div>
  );
}
