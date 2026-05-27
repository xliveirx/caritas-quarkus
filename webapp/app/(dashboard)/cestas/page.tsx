'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import { api } from '@/services/api';
import { Pagination } from '@/components/ui/pagination';
import { NewKitModal } from '@/components/new-kit-modal';
import type { KitResponse } from '@/shared/types/kit-response';
import type { PaginatedResponse } from '@/shared/types/paginated-response';
import type { ApiErrorResponse } from '@/shared/types/api-error-response';
import type { ProductDetailResponse } from '@/shared/types/product-detail-response';
import { SearchBar } from '@/components/ui/search-bar';
import { FilterDropdown } from '@/components/ui/filter-dropdown';

const PAGE_SIZE = 12;

const ACTIVE_OPTIONS = [
  { value: '', label: 'Todas' },
  { value: 'true', label: 'Ativas' },
  { value: 'false', label: 'Inativas' },
];

const UNIT_LABELS: Record<string, string> = {
  KG: 'kg', G: 'g', ML: 'mL', L: 'L', UNIDADES: 'un.',
};

const CATEGORY_LABELS: Record<string, string> = {
  CALCA: 'Calça', CAMISETA: 'Camiseta', MOLETOM: 'Moletom', CASACO: 'Casaco',
  TENIS: 'Tênis', SAPATO: 'Sapato', BOTA: 'Bota', ACESSORIO: 'Acessório', JAQUETA: 'Jaqueta',
};

const GENDER_LABELS: Record<string, string> = {
  MASCULINO: 'Masculino', FEMININO: 'Feminino', UNISSEX: 'Unissex',
};

function formatDate(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function ProductTags({ product }: { product: ProductDetailResponse }) {
  const parts: string[] = [];
  if (product.type === 'CLOTHES') {
    if (product.category) parts.push(`Categoria ${CATEGORY_LABELS[product.category] ?? product.category}`);
    if (product.size)     parts.push(`Tamanho ${product.size}`);
    if (product.gender)   parts.push(`Gênero ${GENDER_LABELS[product.gender] ?? product.gender}`);
    parts.push(product.condition === 'NOVO' ? 'Novo' : 'Usado');
  } else if (product.type === 'FOOD') {
    if (product.batch)          parts.push(`Lote ${product.batch}`);
    if (product.expirationDate) parts.push(`Val. ${formatDate(product.expirationDate)}`);
  } else {
    console.error('[ProductTags] tipo de produto desconhecido:', (product as { type: unknown }).type);
  }
  if (parts.length === 0) return null;
  return (
    <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">{parts.join(' · ')}</p>
  );
}

/* ─── Detail Modal ─────────────────────────────────────────────────── */

function KitDetailModal({
  kit,
  onClose,
  onToggle,
  toggling,
}: {
  kit: KitResponse;
  onClose: () => void;
  onToggle: (kit: KitResponse) => void;
  toggling: boolean;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[92dvh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
          <div className="flex-1 min-w-0 pr-3">
            <h2 className="text-base font-bold text-slate-900">{kit.name}</h2>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
              {kit.parish.name}
              <span className={[
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold',
                kit.active
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  : 'bg-slate-100 text-slate-500 border border-slate-200',
              ].join(' ')}>
                <span className={['w-1.5 h-1.5 rounded-full', kit.active ? 'bg-emerald-500' : 'bg-slate-400'].join(' ')} />
                {kit.active ? 'Ativa' : 'Inativa'}
              </span>
            </p>
          </div>
          <button onClick={onClose} aria-label="Fechar"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100
              transition-colors duration-150 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="w-5 h-5"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">

          {/* Description */}
          {kit.description && (
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Descrição</p>
              <p className="text-sm text-slate-600 leading-relaxed">{kit.description}</p>
            </div>
          )}

          {/* Items */}
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Itens ({kit.items.length})
            </p>
            {kit.items.length === 0 ? (
              <p className="text-sm text-slate-400 italic">Nenhum item cadastrado</p>
            ) : (
              <ul className="space-y-2">
                {kit.items.map((item) => (
                  <li key={item.id}
                    className="flex items-start justify-between gap-3 px-3 py-2.5
                      rounded-lg bg-slate-50 border border-slate-200">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 leading-tight">
                        {item.product.name}
                      </p>
                      <ProductTags product={item.product} />
                    </div>
                    <span className="text-xs font-semibold text-slate-500 shrink-0 mt-0.5">
                      {item.quantity}
                      {item.product.defaultUnit && (
                        <span className="text-slate-400 font-normal ml-0.5">
                          {UNIT_LABELS[item.product.defaultUnit] ?? item.product.defaultUnit}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
          <button onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800
              rounded-lg hover:bg-slate-200 transition-colors duration-150">
            Fechar
          </button>
          <button
            onClick={() => onToggle(kit)}
            disabled={toggling}
            className={[
              'px-4 py-2 text-sm font-semibold rounded-lg transition-colors duration-150',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              kit.active
                ? 'text-red-600 hover:bg-red-50 border border-red-200 hover:border-red-300'
                : 'text-emerald-700 hover:bg-emerald-50 border border-emerald-200 hover:border-emerald-300',
            ].join(' ')}>
            {toggling ? '...' : kit.active ? 'Desativar' : 'Ativar'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Kit Card ─────────────────────────────────────────────────────── */

function KitCard({
  kit,
  onToggle,
  toggling,
  onClick,
}: {
  kit: KitResponse;
  onToggle: (kit: KitResponse) => void;
  toggling: boolean;
  onClick: () => void;
}) {
  return (
    <article className="flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm
      transition-all duration-200 overflow-hidden">

      <div className={['h-1 w-full', kit.active
        ? 'bg-gradient-to-r from-wine-800 to-wine-600'
        : 'bg-gradient-to-r from-slate-300 to-slate-200'].join(' ')} />

      {/* Clickable body */}
      <button
        type="button"
        onClick={onClick}
        className="flex-1 flex items-start gap-3 p-5 text-left cursor-pointer hover:bg-slate-50 active:bg-slate-100 transition-colors duration-150 group">
        <div className={[
          'flex items-center justify-center w-10 h-10 rounded-xl shrink-0',
          kit.active ? 'bg-wine-50' : 'bg-slate-100',
        ].join(' ')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
            strokeLinecap="round" strokeLinejoin="round"
            className={['w-5 h-5', kit.active ? 'text-wine-700' : 'text-slate-400'].join(' ')}>
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 01-8 0"/>
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 text-sm leading-snug group-hover:text-wine-800 transition-colors duration-150">{kit.name}</h3>
          <p className="text-xs text-slate-400 mt-0.5 truncate">{kit.parish.name}</p>
        </div>

        <span className={[
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0',
          kit.active
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
            : 'bg-slate-100 text-slate-500 border border-slate-200',
        ].join(' ')}>
          <span className={['w-1.5 h-1.5 rounded-full', kit.active ? 'bg-emerald-500' : 'bg-slate-400'].join(' ')} />
          {kit.active ? 'Ativa' : 'Inativa'}
        </span>
      </button>

      {/* Footer */}
      <div className="px-5 pb-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="text-xs text-slate-400 flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className="w-3 h-3 shrink-0">
            <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
          </svg>
          {kit.items.length} {kit.items.length === 1 ? 'item' : 'itens'} · ver detalhes
        </span>
        <button
          onClick={() => onToggle(kit)}
          disabled={toggling}
          className={[
            'text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors duration-150',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            kit.active
              ? 'text-red-600 hover:bg-red-50 border border-red-200 hover:border-red-300'
              : 'text-emerald-700 hover:bg-emerald-50 border border-emerald-200 hover:border-emerald-300',
          ].join(' ')}>
          {toggling ? '...' : kit.active ? 'Desativar' : 'Ativar'}
        </button>
      </div>
    </article>
  );
}

/* ─── Skeleton Card ────────────────────────────────────────────────── */

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-pulse">
      <div className="h-1 w-full bg-slate-200" />
      <div className="p-5 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-200 shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 bg-slate-200 rounded w-3/4" />
          <div className="h-3 bg-slate-100 rounded w-1/2" />
          <div className="h-2.5 bg-slate-100 rounded w-1/3 mt-2" />
        </div>
        <div className="h-5 w-14 bg-slate-100 rounded-full shrink-0" />
      </div>
      <div className="px-5 pb-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <div className="h-3 w-12 bg-slate-100 rounded" />
        <div className="h-7 w-20 bg-slate-100 rounded-lg" />
      </div>
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────────────────────── */

export default function CestasPage() {
  const { token } = useAuth();
  const toast = useToast();

  const [kits, setKits]             = useState<KitResponse[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage]             = useState(0);
  const [isLoading, setIsLoading]   = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [modalOpen, setModalOpen]   = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [detailKit, setDetailKit]   = useState<KitResponse | null>(null);

  const [searchInput, setSearchInput]   = useState('');
  const [search, setSearch]             = useState('');
  const [draftActive, setDraftActive]   = useState('');
  const [active, setActive]             = useState('');
  const [openDropdown, setOpenDropdown] = useState<'active' | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openDropdown) return;
    function onMouseDown(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node))
        setOpenDropdown(null);
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [openDropdown]);

  const fetchKits = useCallback(async (currentPage: number) => {
    if (!token) return;
    setIsLoading(true);
    setFetchError(false);
    try {
      const qs = new URLSearchParams({ page: String(currentPage), size: String(PAGE_SIZE) });
      if (search) qs.set('search', search);
      if (active) qs.set('active', active);
      const data = await api.get<PaginatedResponse<KitResponse>>(
        `/api/v1/kits?${qs}`,
        token
      );
      setKits(data.data);
      setTotalItems(data.pagination.totalItems);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      if (apiErr?.status !== 401) setFetchError(true);
    } finally {
      setIsLoading(false);
    }
  }, [token, search, active]);

  useEffect(() => { fetchKits(page); }, [fetchKits, page]);

  function submitSearch() {
    setSearch(searchInput.trim());
    setActive(draftActive);
    setPage(0);
  }

  function clearFilters() {
    setSearchInput('');
    setSearch('');
    setDraftActive('');
    setActive('');
    setPage(0);
  }

  async function handleToggle(kit: KitResponse) {
    if (!token) return;
    setTogglingId(kit.id);
    const path = kit.active
      ? `/api/v1/kits/deactivate/${kit.id}`
      : `/api/v1/kits/activate/${kit.id}`;
    try {
      await api.patch(path, token);
      const updated = { ...kit, active: !kit.active };
      setKits((prev) => prev.map((k) => k.id === kit.id ? updated : k));
      if (detailKit?.id === kit.id) setDetailKit(updated);
      toast.success(
        kit.active ? 'Cesta desativada' : 'Cesta ativada',
        `"${kit.name}" foi ${kit.active ? 'desativada' : 'ativada'} com sucesso.`
      );
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      toast.error(apiErr?.title ?? 'Erro ao atualizar cesta', apiErr?.message);
    } finally {
      setTogglingId(null);
    }
  }

  function handleCreated(kit: KitResponse) {
    if (page === 0) {
      setKits((prev) => [kit, ...prev.slice(0, PAGE_SIZE - 1)]);
      setTotalItems((n) => n + 1);
    } else {
      setPage(0);
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Cestas Básicas</h1>
          {!isLoading && !fetchError && (
            <p className="text-sm text-slate-500 mt-0.5">
              {totalItems} {totalItems === 1 ? 'cesta cadastrada' : 'cestas cadastradas'}
            </p>
          )}
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white
            bg-wine-800 hover:bg-wine-900 rounded-lg transition-colors duration-150
            focus:outline-none focus-visible:ring-2 focus-visible:ring-wine-700">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            className="w-4 h-4"><path d="M5 12h14M12 5v14" /></svg>
          Nova cesta
        </button>
      </div>

      {/* Search + filters */}
      <div className="mb-6 space-y-2.5">
        <SearchBar
          value={searchInput}
          onChange={setSearchInput}
          onSubmit={submitSearch}
          placeholder="Buscar por nome..."
        />
        <div ref={filterRef} className="flex flex-wrap items-center gap-2">
          <FilterDropdown
            label="Status"
            value={draftActive}
            options={ACTIVE_OPTIONS}
            isOpen={openDropdown === 'active'}
            onToggle={() => setOpenDropdown(openDropdown === 'active' ? null : 'active')}
            onSelect={(v) => { setDraftActive(v); setOpenDropdown(null); }}
          />
          {(searchInput || draftActive) && (
            <button type="button" onClick={clearFilters}
              className="text-xs font-semibold text-slate-400 hover:text-slate-600
                transition-colors duration-150 underline underline-offset-2">
              Limpar tudo
            </button>
          )}
        </div>
      </div>

      {/* Error state */}
      {fetchError && (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 text-slate-300">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-sm font-medium text-slate-500">Não foi possível carregar as cestas.</p>
          <button onClick={() => fetchKits(page)}
            className="text-xs font-semibold text-wine-700 hover:text-wine-800 underline underline-offset-2">
            Tentar novamente
          </button>
        </div>
      )}

      {/* Grid */}
      {!fetchError && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {isLoading
              ? Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonCard key={i} />)
              : kits.length === 0
              ? (
                <div className="col-span-full flex flex-col items-center gap-3 py-20 text-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                    className="w-10 h-10 text-slate-300" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <path d="M16 10a4 4 0 01-8 0"/>
                  </svg>
                  <p className="text-sm font-medium text-slate-500">Nenhuma cesta cadastrada</p>
                  <button onClick={() => setModalOpen(true)}
                    className="text-xs text-wine-700 hover:text-wine-800 font-semibold underline underline-offset-2">
                    Criar a primeira cesta
                  </button>
                </div>
              )
              : kits.map((kit) => (
                <KitCard
                  key={kit.id}
                  kit={kit}
                  onToggle={handleToggle}
                  toggling={togglingId === kit.id}
                  onClick={() => setDetailKit(kit)}
                />
              ))
            }
          </div>

          {totalPages > 1 && !isLoading && (
            <div className="mt-6">
              <Pagination
                page={page}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={PAGE_SIZE}
                onPage={setPage}
              />
            </div>
          )}
        </>
      )}

      <NewKitModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreated}
      />

      {detailKit && (
        <KitDetailModal
          kit={detailKit}
          onClose={() => setDetailKit(null)}
          onToggle={handleToggle}
          toggling={togglingId === detailKit.id}
        />
      )}
    </div>
  );
}
