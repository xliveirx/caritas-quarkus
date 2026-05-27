'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/services/api';
import { SkeletonRow } from '@/components/ui/skeleton-row';
import { Pagination } from '@/components/ui/pagination';
import { ErrorState } from '@/components/ui/error-state';
import type { ClothesStockItem } from '@/shared/types/clothes-stock-item';
import type { FoodStockItem } from '@/shared/types/food-stock-item';
import type { PaginatedResponse } from '@/shared/types/paginated-response';
import type { ApiErrorResponse } from '@/shared/types/api-error-response';
import { SearchBar } from '@/components/ui/search-bar';
import { FilterDropdown } from '@/components/ui/filter-dropdown';

type Tab = 'clothes' | 'food';

const PAGE_SIZE = 10;

const CATEGORY_LABELS: Record<string, string> = {
  CALCA: 'Calça', CAMISETA: 'Camiseta', MOLETOM: 'Moletom', CASACO: 'Casaco',
  TENIS: 'Tênis', SAPATO: 'Sapato', BOTA: 'Bota', ACESSORIO: 'Acessório', JAQUETA: 'Jaqueta',
};

const GENDER_LABELS: Record<string, string> = {
  MASCULINO: 'Masculino', FEMININO: 'Feminino', UNISSEX: 'Unissex',
};

const UNIT_LABELS: Record<string, string> = {
  KG: 'kg', G: 'g', ML: 'mL', L: 'L', UNIDADES: 'unidades',
};

const CATEGORY_OPTIONS = [
  { value: '', label: 'Categoria' },
  ...Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label })),
];

const GENDER_OPTIONS = [
  { value: '', label: 'Gênero' },
  ...Object.entries(GENDER_LABELS).map(([value, label]) => ({ value, label })),
];

const CONDITION_OPTIONS = [
  { value: '', label: 'Condição' },
  { value: 'NOVO', label: 'Novo' },
  { value: 'USADO', label: 'Usado' },
];

const EXPIRED_OPTIONS = [
  { value: '', label: 'Validade' },
  { value: 'true', label: 'Vencidos' },
  { value: 'false', label: 'Válidos' },
];

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr + 'T00:00:00')
      .toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function QuantityBadge({ qty, unit }: { qty: number; unit?: string | null }) {
  const color = qty === 0
    ? 'bg-red-50 text-red-700 border-red-100'
    : qty <= 5
    ? 'bg-amber-50 text-amber-700 border-amber-100'
    : 'bg-emerald-50 text-emerald-700 border-emerald-100';

  const label = unit ? (UNIT_LABELS[unit] ?? unit.toLowerCase()) : null;

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full
      text-xs font-semibold border ${color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        qty === 0 ? 'bg-red-500' : qty <= 5 ? 'bg-amber-500' : 'bg-emerald-500'
      }`} />
      {qty}{label ? ` ${label}` : ''}
    </span>
  );
}

type OpenDropdown = 'category' | 'gender' | 'condition' | null;

/* ─── Roupas Tab ─────────────────────────────────────────────────── */

function ClothesTab() {
  const { token, user } = useAuth();
  const isAdmin = user?.roles.includes('ADMIN') ?? false;

  const [items, setItems]           = useState<ClothesStockItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage]             = useState(0);
  const [isLoading, setIsLoading]   = useState(true);
  const [fetchError, setFetchError] = useState<{ title: string; message?: string } | null>(null);

  const [searchInput, setSearchInput]   = useState('');
  const [search, setSearch]             = useState('');
  const [draftCategory, setDraftCategory] = useState('');
  const [draftGender, setDraftGender]   = useState('');
  const [draftCondition, setDraftCondition] = useState('');
  const [category, setCategory]         = useState('');
  const [gender, setGender]             = useState('');
  const [condition, setCondition]       = useState('');
  const [openDropdown, setOpenDropdown] = useState<OpenDropdown>(null);
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

  const fetchItems = useCallback(async (currentPage: number) => {
    if (!token) return;
    setIsLoading(true);
    setFetchError(null);
    try {
      const qs = new URLSearchParams({ page: String(currentPage), size: String(PAGE_SIZE) });
      if (search) qs.set('search', search);
      if (category) qs.set('category', category);
      if (gender) qs.set('gender', gender);
      if (condition) qs.set('condition', condition);
      const data = await api.get<PaginatedResponse<ClothesStockItem>>(
        `/api/v1/stock/clothes?${qs}`,
        token
      );
      setItems(data.data);
      setTotalItems(data.pagination.totalItems);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      setFetchError({ title: apiErr?.title ?? 'Erro ao carregar estoque', message: apiErr?.message });
    } finally {
      setIsLoading(false);
    }
  }, [token, search, category, gender, condition]);

  useEffect(() => { fetchItems(page); }, [fetchItems, page]);

  function submitSearch() {
    setSearch(searchInput.trim());
    setCategory(draftCategory);
    setGender(draftGender);
    setCondition(draftCondition);
    setPage(0);
  }

  function clearFilters() {
    setSearchInput('');
    setSearch('');
    setDraftCategory('');
    setDraftGender('');
    setDraftCondition('');
    setCategory('');
    setGender('');
    setCondition('');
    setPage(0);
  }

  const hasActiveFilters = search || category || gender || condition;

  if (!isLoading && fetchError) {
    return <ErrorState title={fetchError.title} message={fetchError.message} onRetry={() => fetchItems(page)} />;
  }

  const headers = isAdmin
    ? ['Produto', 'Categoria', 'Tamanho', 'Gênero', 'Condição', 'Paróquia', 'Disponível']
    : ['Produto', 'Categoria', 'Tamanho', 'Gênero', 'Condição', 'Disponível'];

  return (
    <>
      {/* Search + filters */}
      <div className="mb-4 space-y-2.5">
        <SearchBar
          value={searchInput}
          onChange={setSearchInput}
          onSubmit={submitSearch}
          placeholder="Buscar por produto..."
        />
        <div ref={filterRef} className="flex flex-wrap items-center gap-2">
          <FilterDropdown
            label="Categoria"
            value={draftCategory}
            options={CATEGORY_OPTIONS}
            isOpen={openDropdown === 'category'}
            onToggle={() => setOpenDropdown(openDropdown === 'category' ? null : 'category')}
            onSelect={(v) => { setDraftCategory(v); setOpenDropdown(null); }}
            minWidth="160px"
          />
          <FilterDropdown
            label="Gênero"
            value={draftGender}
            options={GENDER_OPTIONS}
            isOpen={openDropdown === 'gender'}
            onToggle={() => setOpenDropdown(openDropdown === 'gender' ? null : 'gender')}
            onSelect={(v) => { setDraftGender(v); setOpenDropdown(null); }}
          />
          <FilterDropdown
            label="Condição"
            value={draftCondition}
            options={CONDITION_OPTIONS}
            isOpen={openDropdown === 'condition'}
            onToggle={() => setOpenDropdown(openDropdown === 'condition' ? null : 'condition')}
            onSelect={(v) => { setDraftCondition(v); setOpenDropdown(null); }}
          />
          {(searchInput || draftCategory || draftGender || draftCondition) && (
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
                {headers.map((h) => (
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
                  <SkeletonRow key={i} widths={isAdmin ? [30, 20, 10, 18, 14, 12, 28] : [30, 20, 10, 18, 14, 12]} />
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={headers.length} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 text-slate-300">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                        <line x1="12" y1="22.08" x2="12" y2="12" />
                      </svg>
                      <p className="text-sm font-medium text-slate-500">Nenhuma roupa em estoque</p>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors duration-100">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                          <span className="text-violet-700 font-bold text-xs">
                            {item.clothes.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{item.clothes.name}</p>
                          {item.clothes.description && (
                            <p className="text-xs text-slate-400 mt-0.5">{item.clothes.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600 text-sm">
                      {item.clothes.category
                        ? CATEGORY_LABELS[item.clothes.category] ?? item.clothes.category
                        : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-5 py-4 text-slate-600 text-sm">
                      {item.clothes.size
                        ? <span>{item.clothes.size}</span>
                        : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-5 py-4 text-slate-600 text-sm">
                      {item.clothes.gender
                        ? GENDER_LABELS[item.clothes.gender] ?? item.clothes.gender
                        : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-5 py-4 text-slate-600 text-sm">
                      {item.clothes.condition ? (
                        <span>
                          {item.clothes.condition === 'NOVO' ? 'Novo' : 'Usado'}
                        </span>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                    {isAdmin && (
                      <td className="px-5 py-4 text-slate-500 text-sm">{item.parish.name}</td>
                    )}
                    <td className="px-5 py-4">
                      <QuantityBadge qty={item.availableQuantity} unit={item.clothes.defaultUnit} />
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
    </>
  );
}

/* ─── Alimentos Tab ──────────────────────────────────────────────── */

function FoodTab() {
  const { token, user } = useAuth();
  const isAdmin = user?.roles.includes('ADMIN') ?? false;

  const [items, setItems]           = useState<FoodStockItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage]             = useState(0);
  const [isLoading, setIsLoading]   = useState(true);
  const [fetchError, setFetchError] = useState<{ title: string; message?: string } | null>(null);

  const [searchInput, setSearchInput]   = useState('');
  const [search, setSearch]             = useState('');
  const [draftExpired, setDraftExpired] = useState('');
  const [expired, setExpired]           = useState('');
  const [openDropdown, setOpenDropdown] = useState<'expired' | null>(null);
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

  const fetchItems = useCallback(async (currentPage: number) => {
    if (!token) return;
    setIsLoading(true);
    setFetchError(null);
    try {
      const qs = new URLSearchParams({ page: String(currentPage), size: String(PAGE_SIZE) });
      if (search) qs.set('search', search);
      if (expired) qs.set('expired', expired);
      const data = await api.get<PaginatedResponse<FoodStockItem>>(
        `/api/v1/stock/foods?${qs}`,
        token
      );
      setItems(data.data);
      setTotalItems(data.pagination.totalItems);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      setFetchError({ title: apiErr?.title ?? 'Erro ao carregar estoque', message: apiErr?.message });
    } finally {
      setIsLoading(false);
    }
  }, [token, search, expired]);

  useEffect(() => { fetchItems(page); }, [fetchItems, page]);

  function submitSearch() {
    setSearch(searchInput.trim());
    setExpired(draftExpired);
    setPage(0);
  }

  function clearFilters() {
    setSearchInput('');
    setSearch('');
    setDraftExpired('');
    setExpired('');
    setPage(0);
  }

  if (!isLoading && fetchError) {
    return <ErrorState title={fetchError.title} message={fetchError.message} onRetry={() => fetchItems(page)} />;
  }

  const headers = isAdmin
    ? ['Produto', 'Lote', 'Validade', 'Paróquia', 'Disponível']
    : ['Produto', 'Lote', 'Validade', 'Disponível'];

  return (
    <>
      {/* Search + filters */}
      <div className="mb-4 space-y-2.5">
        <SearchBar
          value={searchInput}
          onChange={setSearchInput}
          onSubmit={submitSearch}
          placeholder="Buscar por produto..."
        />
        <div ref={filterRef} className="flex flex-wrap items-center gap-2">
          <FilterDropdown
            label="Validade"
            value={draftExpired}
            options={EXPIRED_OPTIONS}
            isOpen={openDropdown === 'expired'}
            onToggle={() => setOpenDropdown(openDropdown === 'expired' ? null : 'expired')}
            onSelect={(v) => { setDraftExpired(v); setOpenDropdown(null); }}
          />
          {(searchInput || draftExpired) && (
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
                {headers.map((h) => (
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
                  <SkeletonRow key={i} widths={isAdmin ? [30, 20, 18, 12, 28] : [30, 20, 18, 12]} />
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={headers.length} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 text-slate-300">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                        <line x1="12" y1="22.08" x2="12" y2="12" />
                      </svg>
                      <p className="text-sm font-medium text-slate-500">Nenhum alimento em estoque</p>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const isExpired = item.food.expirationDate
                    ? new Date(item.food.expirationDate + 'T00:00:00') < new Date()
                    : false;
                  const expiresSoon = !isExpired && item.food.expirationDate
                    ? (new Date(item.food.expirationDate + 'T00:00:00').getTime() - Date.now()) < 7 * 24 * 60 * 60 * 1000
                    : false;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors duration-100">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                            <span className="text-emerald-700 font-bold text-xs">
                              {item.food.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{item.food.name}</p>
                            {item.food.description && (
                              <p className="text-xs text-slate-400 mt-0.5">{item.food.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600 text-xs font-mono">
                        {item.food.batch ?? <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-5 py-4">
                        {item.food.expirationDate ? (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                            text-xs font-semibold border ${
                              isExpired
                                ? 'bg-red-50 text-red-700 border-red-100'
                                : expiresSoon
                                ? 'bg-amber-50 text-amber-700 border-amber-100'
                                : 'bg-slate-50 text-slate-600 border-slate-200'
                            }`}>
                            {isExpired && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                            {expiresSoon && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                            {formatDate(item.food.expirationDate)}
                            {isExpired && ' · Vencido'}
                            {expiresSoon && ' · Vence em breve'}
                          </span>
                        ) : <span className="text-slate-300">—</span>}
                      </td>
                       {isAdmin && (
                        <td className="px-5 py-4 text-slate-500 text-sm">{item.parish.name}</td>
                      )}
                      <td className="px-5 py-4">
                        <QuantityBadge qty={item.availableQuantity} unit={item.food.defaultUnit} />
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
    </>
  );
}

/* ─── Page ───────────────────────────────────────────────────────── */

export default function EstoquePage() {
  const [tab, setTab] = useState<Tab>('clothes');

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Estoque</h1>
        <p className="text-sm text-slate-500 mt-0.5">Itens disponíveis para distribuição</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-slate-100 w-fit mb-6">
        {([
          { value: 'clothes', label: 'Roupas' },
          { value: 'food',    label: 'Alimentos' },
        ] as { value: Tab; label: string }[]).map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={[
              'px-5 py-2 text-sm font-semibold rounded-lg transition-colors duration-150',
              tab === t.value
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'clothes' ? <ClothesTab /> : <FoodTab />}
    </div>
  );
}
