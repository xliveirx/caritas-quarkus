'use client';

import { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/services/api';
import { Pagination } from '@/components/ui/pagination';
import { ErrorState } from '@/components/ui/error-state';
import { SearchBar } from '@/components/ui/search-bar';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { getParishFromToken } from '@/shared/utils/token';
import { formatCurrency } from '@/shared/utils/formatters';
import { SITUATION_LABELS, type Situation } from '@/shared/types/situation';
import type { FamilyResponse } from '@/shared/types/family-response';
import type { ParishResponse } from '@/shared/types/parish-response';
import type { PaginatedResponse } from '@/shared/types/paginated-response';
import type { ApiErrorResponse } from '@/shared/types/api-error-response';

const PAGE_SIZE = 12;

const SITUATION_COLORS: Record<Situation, string> = {
  RISCO_BAIXO:       'bg-emerald-50 text-emerald-700 border-emerald-100',
  RISCO_MEDIO:       'bg-amber-50 text-amber-700 border-amber-100',
  RISCO_ALTO:        'bg-orange-50 text-orange-700 border-orange-100',
  POBREZA_EXTREMA:   'bg-red-50 text-red-700 border-red-100',
  EMERGENCIA_SOCIAL: 'bg-purple-50 text-purple-700 border-purple-100',
};

function SituationBadge({ situation }: { situation: Situation }) {
  return (
    <span className={[
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border',
      SITUATION_COLORS[situation],
    ].join(' ')}>
      {SITUATION_LABELS[situation]}
    </span>
  );
}

function FamilyCardSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl">
      <div className="w-10 h-10 rounded-full bg-slate-200 animate-pulse shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-slate-200 rounded animate-pulse w-2/5" />
        <div className="h-3 bg-slate-100 rounded animate-pulse w-1/4" />
      </div>
    </div>
  );
}

/* ─── Inner content (needs useSearchParams) ──────────────────────── */

function VisitasContent() {
  const searchParams  = useSearchParams();
  const router        = useRouter();
  const { user, token } = useAuth();

  const isAdmin    = user?.roles.includes('ADMIN') ?? false;
  const jwtParish  = token ? getParishFromToken(token) : null;

  const parishIdParam = searchParams.get('paroquia');
  const activeParishId = isAdmin
    ? (parishIdParam ? Number(parishIdParam) : null)
    : jwtParish;

  /* ── Parishes (admin dropdown) ──────────────────────────────────── */
  const [parishes, setParishes]               = useState<ParishResponse[]>([]);
  const [isLoadingParishes, setIsLoadingParishes] = useState(false);
  const [parishDropdownOpen, setParishDropdownOpen] = useState(false);
  const parishDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAdmin || !token) return;
    setIsLoadingParishes(true);
    api.get<PaginatedResponse<ParishResponse>>('/api/v1/parishes?page=0&size=100', token)
      .then((d) => setParishes(d.data.filter((p) => !p.isDiocese)))
      .catch(() => {})
      .finally(() => setIsLoadingParishes(false));
  }, [isAdmin, token]);

  useEffect(() => {
    if (!parishDropdownOpen) return;
    function onMouseDown(e: MouseEvent) {
      if (parishDropdownRef.current && !parishDropdownRef.current.contains(e.target as Node))
        setParishDropdownOpen(false);
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [parishDropdownOpen]);

  /* ── Families ───────────────────────────────────────────────────── */
  const [families, setFamilies]   = useState<FamilyResponse[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage]           = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<{ title: string; message?: string } | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch]       = useState('');

  const fetchFamilies = useCallback(async (currentPage: number) => {
    if (!token || activeParishId === null) return;
    setIsLoading(true);
    setFetchError(null);
    try {
      const qs = new URLSearchParams({
        page: String(currentPage),
        size: String(PAGE_SIZE),
        parishId: String(activeParishId),
      });
      if (search.trim()) qs.set('search', search.trim());
      const data = await api.get<PaginatedResponse<FamilyResponse>>(
        `/api/v1/families?${qs}`,
        token
      );
      setFamilies(data.data);
      setTotalItems(data.pagination.totalItems);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      setFetchError({ title: apiErr?.title ?? 'Erro ao carregar famílias', message: apiErr?.message });
    } finally {
      setIsLoading(false);
    }
  }, [token, activeParishId, search]);

  useEffect(() => {
    setPage(0);
    setFamilies([]);
  }, [activeParishId]);

  useEffect(() => { fetchFamilies(page); }, [fetchFamilies, page]);

  function submitSearch() { setSearch(searchInput.trim()); setPage(0); }
  function clearSearch()  { setSearchInput(''); setSearch(''); setPage(0); }

  function selectParish(id: string) {
    const url = id ? `/visitas?paroquia=${id}` : '/visitas';
    router.replace(url);
    setSearch(''); setSearchInput(''); setPage(0);
  }

  const selectedParish = parishes.find((p) => p.id === activeParishId);

  if (!isLoading && fetchError && activeParishId !== null) {
    return <ErrorState title={fetchError.title} message={fetchError.message} onRetry={() => fetchFamilies(page)} />;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Visitas</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {activeParishId
            ? `Famílias${selectedParish ? ` · ${selectedParish.name}` : ''}`
            : isAdmin
              ? 'Selecione uma paróquia para ver as famílias'
              : 'Famílias da sua paróquia'}
        </p>

        {/* Parish selector — admin only */}
        {isAdmin && !isLoadingParishes && parishes.length > 0 && (
          <div ref={parishDropdownRef} className="mt-3">
            <FilterDropdown
              label="Paróquia"
              value={activeParishId ? String(activeParishId) : ''}
              options={[
                { value: '', label: 'Todas' },
                ...parishes.map((p) => ({ value: String(p.id), label: p.name })),
              ]}
              isOpen={parishDropdownOpen}
              onToggle={() => setParishDropdownOpen((o) => !o)}
              onSelect={(v) => { selectParish(v); setParishDropdownOpen(false); }}
              minWidth="220px"
            />
          </div>
        )}
      </div>

      {/* No parish selected (admin) */}
      {isAdmin && activeParishId === null ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              className="w-7 h-7 text-slate-400">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-700 mb-1">Nenhuma paróquia selecionada</p>
          <p className="text-xs text-slate-400">Use o seletor acima para filtrar as famílias por paróquia</p>
        </div>
      ) : (
        <>
          {/* Search */}
          <div className="mb-5">
            <SearchBar
              value={searchInput}
              onChange={setSearchInput}
              onSubmit={submitSearch}
              placeholder="Buscar por nome, CPF, nome da mãe..."
            />
            {(search || searchInput) && (
              <button type="button" onClick={clearSearch}
                className="mt-1.5 text-xs font-semibold text-slate-400 hover:text-slate-600
                  underline underline-offset-2 transition-colors duration-150">
                Limpar busca
              </button>
            )}
          </div>

          {/* Total badge */}
          {!isLoading && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-semibold text-slate-500">
                {totalItems} {totalItems === 1 ? 'família encontrada' : 'famílias encontradas'}
              </span>
            </div>
          )}

          {/* Family list */}
          <div className="space-y-2">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => <FamilyCardSkeleton key={i} />)
            ) : families.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 text-slate-300 mb-3">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                <p className="text-sm font-medium text-slate-500">
                  {search ? 'Nenhuma família encontrada para essa busca' : 'Nenhuma família cadastrada nesta paróquia'}
                </p>
              </div>
            ) : (
              families.map((family) => {
                const responsible = family.members.find((m) => m.responsible);
                const initial = responsible?.name.charAt(0).toUpperCase() ?? '?';
                return (
                  <Link
                    key={family.id}
                    href={`/visitas/${family.id}`}
                    className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl
                      hover:border-wine-300 hover:shadow-sm transition-all duration-150 group"
                  >
                    <div className="w-10 h-10 rounded-full bg-wine-50 border border-wine-100
                      flex items-center justify-center shrink-0
                      group-hover:bg-wine-100 transition-colors duration-150">
                      <span className="text-wine-700 font-bold text-sm">{initial}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900 text-sm truncate">
                          {responsible?.name ?? `Família #${family.id}`}
                        </span>
                        <SituationBadge situation={family.situation} />
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {family.members.length} {family.members.length === 1 ? 'membro' : 'membros'}
                        {' · '}
                        {formatCurrency(family.monthlyIncome)}
                      </p>
                    </div>

                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      className="w-4 h-4 text-slate-300 group-hover:text-wine-600
                        transition-colors duration-150 shrink-0">
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </Link>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 bg-white rounded-xl border border-slate-200">
              <Pagination
                page={page} totalPages={totalPages}
                totalItems={totalItems} pageSize={PAGE_SIZE}
                onPage={setPage}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ─── Page wrapper (Suspense for useSearchParams) ────────────────── */

function LoadingFallback() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="h-7 w-24 bg-slate-200 rounded animate-pulse mb-6" />
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => <FamilyCardSkeleton key={i} />)}
      </div>
    </div>
  );
}

export default function VisitasPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <VisitasContent />
    </Suspense>
  );
}
