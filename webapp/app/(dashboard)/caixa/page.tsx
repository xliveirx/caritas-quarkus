'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/services/api';
import { BazarSaleDrawer } from '@/components/bazar-sale-drawer';
import type { CashRegisterResponse, CashMovementResponse } from '@/shared/types/cash-register-response';
import type { BazarSaleResponse } from '@/shared/types/bazar-sale-response';
import type { ParishResponse } from '@/shared/types/parish-response';
import type { PaginatedResponse } from '@/shared/types/paginated-response';
import type { ApiErrorResponse } from '@/shared/types/api-error-response';

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

/* ─── Origin label ───────────────────────────────────────────────── */

const ORIGIN_LABEL: Record<string, string> = {
  BAZAR:  'Bazar / Brechó',
  BRECHO: 'Brechó',
  MANUAL: 'Lançamento manual',
};

/* ─── Group movements by date ────────────────────────────────────── */

function groupByDate(movements: CashMovementResponse[]) {
  const sorted = [...movements].sort(
    (a, b) => new Date(b.occuredAt).getTime() - new Date(a.occuredAt).getTime()
  );
  const map = new Map<string, CashMovementResponse[]>();
  for (const m of sorted) {
    const key = m.occuredAt.slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(m);
  }
  return map;
}

/* ─── Movement item ──────────────────────────────────────────────── */

function MovementItem({
  movement,
  onDetail,
}: {
  movement: CashMovementResponse;
  onDetail: (m: CashMovementResponse) => void;
}) {
  const isIncome = movement.type === 'INCOME';
  const canDetail = movement.origin === 'BAZAR' && movement.referenceId != null;

  return (
    <div
      onClick={() => canDetail && onDetail(movement)}
      className={[
        'flex items-center gap-4 px-4 py-3.5 rounded-xl bg-white border border-slate-200',
        'transition-colors duration-150',
        canDetail ? 'cursor-pointer hover:bg-slate-50 hover:border-slate-300' : '',
      ].join(' ')}
    >
      {/* Icon */}
      <div className={[
        'w-9 h-9 rounded-full flex items-center justify-center shrink-0',
        isIncome ? 'bg-emerald-50' : 'bg-red-50',
      ].join(' ')}>
        {isIncome ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            className="w-4 h-4 text-emerald-600">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            className="w-4 h-4 text-red-500">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 leading-tight">
          {ORIGIN_LABEL[movement.origin] ?? movement.origin}
        </p>
        <p className="text-xs text-slate-400 mt-0.5">
          {formatDateTime(movement.occuredAt)}
          {movement.referenceId != null && (
            <span className="ml-2 text-slate-300">· Ref. #{movement.referenceId}</span>
          )}
        </p>
      </div>

      {/* Amount */}
      <div className="shrink-0 text-right">
        <span className={`text-base font-bold ${isIncome ? 'text-emerald-600' : 'text-red-500'}`}>
          {isIncome ? '+' : '−'} {BRL.format(movement.amount)}
        </span>
      </div>

      {/* Detail arrow */}
      {canDetail && (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className="w-4 h-4 text-slate-300 shrink-0">
          <path d="m9 18 6-6-6-6" />
        </svg>
      )}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────── */

export default function CaixaPage() {
  const { token, user } = useAuth();
  const isAdmin = user?.roles.includes('ADMIN') ?? false;

  const [cashRegister, setCashRegister]   = useState<CashRegisterResponse | null>(null);
  const [isLoading, setIsLoading]         = useState(true);
  const [fetchError, setFetchError]       = useState(false);

  const [parishes, setParishes]           = useState<ParishResponse[]>([]);
  const [selectedParishId, setSelectedParishId] = useState('');

  const [drawerSale, setDrawerSale]       = useState<BazarSaleResponse | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<number | null>(null);

  /* fetch parishes for admin selector */
  useEffect(() => {
    if (!isAdmin || !token) return;
    api.get<PaginatedResponse<ParishResponse>>('/api/v1/parishes?page=0&size=200', token)
      .then((res) => setParishes(res.data))
      .catch(() => {});
  }, [isAdmin, token]);

  /* fetch cash register */
  const fetchCashRegister = useCallback(async () => {
    if (!token) return;
    if (isAdmin && !selectedParishId) {
      setCashRegister(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setFetchError(false);
    try {
      const qs = new URLSearchParams();
      if (isAdmin && selectedParishId) qs.set('parishId', selectedParishId);
      const data = await api.get<CashRegisterResponse>(
        `/api/v1/cash-register${qs.toString() ? `?${qs}` : ''}`, token
      );
      setCashRegister(data);
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      if (apiErr?.status !== 401) setFetchError(true);
    } finally {
      setIsLoading(false);
    }
  }, [token, isAdmin, selectedParishId]);

  useEffect(() => { fetchCashRegister(); }, [fetchCashRegister]);

  /* open bazar detail */
  async function handleMovementDetail(movement: CashMovementResponse) {
    if (!movement.referenceId || !token) return;
    setLoadingDetail(movement.id);
    try {
      const sale = await api.get<BazarSaleResponse>(
        `/api/v1/bazar/${movement.referenceId}`, token
      );
      setDrawerSale(sale);
    } catch {
      /* silently ignore — detail unavailable */
    } finally {
      setLoadingDetail(null);
    }
  }

  const grouped = cashRegister ? groupByDate(cashRegister.movements) : new Map();

  /* ── Render ── */

  return (
    <div className="p-6 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Caixa</h1>
          <p className="text-sm text-slate-500 mt-0.5">Saldo e movimentações financeiras</p>
        </div>

        {isAdmin && (
          <select
            value={selectedParishId}
            onChange={(e) => setSelectedParishId(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white
              text-slate-700 focus:outline-none focus:ring-2 focus:ring-wine-700/20
              focus:border-wine-700 transition-colors duration-150 min-w-[220px]"
          >
            <option value="">Selecione uma paróquia</option>
            {parishes.filter((p) => p.isDiocese).length > 0 && (
              <optgroup label="Diocese">
                {parishes.filter((p) => p.isDiocese).map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </optgroup>
            )}
            {parishes.filter((p) => !p.isDiocese).length > 0 && (
              <optgroup label="Paróquias">
                {parishes.filter((p) => !p.isDiocese).map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </optgroup>
            )}
          </select>
        )}
      </div>

      {/* Admin — no parish selected yet */}
      {isAdmin && !selectedParishId && (
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 text-slate-300">
            <rect x="2" y="7" width="20" height="14" rx="2" />
            <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
            <line x1="12" y1="12" x2="12" y2="16" />
            <line x1="10" y1="14" x2="14" y2="14" />
          </svg>
          <p className="text-sm font-medium text-slate-500">Selecione uma paróquia para ver o caixa</p>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (selectedParishId || !isAdmin) && (
        <div className="space-y-4 animate-pulse">
          <div className="h-40 rounded-2xl bg-slate-100" />
          <div className="h-6 w-32 rounded bg-slate-100" />
          <div className="space-y-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-slate-100" />
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {!isLoading && fetchError && (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 text-slate-300">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-sm font-medium text-slate-500">Não foi possível carregar o caixa.</p>
          <button onClick={fetchCashRegister}
            className="text-xs font-semibold text-wine-700 hover:text-wine-800 underline underline-offset-2">
            Tentar novamente
          </button>
        </div>
      )}

      {/* Content */}
      {!isLoading && !fetchError && cashRegister && (
        <div className="space-y-6">

          {/* Balance card */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm px-8 py-8 flex items-center justify-between gap-6">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Saldo atual
              </p>
              <p className={[
                'text-5xl font-bold tracking-tight leading-none',
                cashRegister.balance >= 0 ? 'text-slate-900' : 'text-red-600',
              ].join(' ')}>
                {BRL.format(cashRegister.balance)}
              </p>
              <p className="text-sm text-slate-400 mt-2">{cashRegister.parish.name}</p>
            </div>

            <div className="shrink-0 flex flex-col items-end gap-1.5 text-right">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Entradas</span>
                <span className="text-sm font-semibold text-emerald-600">
                  {BRL.format(
                    cashRegister.movements
                      .filter((m) => m.type === 'INCOME')
                      .reduce((s, m) => s + Number(m.amount), 0)
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Saídas</span>
                <span className="text-sm font-semibold text-red-500">
                  {BRL.format(
                    cashRegister.movements
                      .filter((m) => m.type === 'EXPENSE')
                      .reduce((s, m) => s + Number(m.amount), 0)
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1 pt-1 border-t border-slate-100">
                <span className="text-xs text-slate-400">Movimentações</span>
                <span className="text-sm font-bold text-slate-600">
                  {cashRegister.movements.length}
                </span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          {cashRegister.movements.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 text-slate-300">
                <rect x="2" y="7" width="20" height="14" rx="2" />
                <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
              </svg>
              <p className="text-sm font-medium text-slate-500">Nenhuma movimentação registrada</p>
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Movimentações
              </p>

              {Array.from(grouped.entries()).map(([dateKey, dayMovements]) => (
                <div key={dateKey}>
                  {/* Date label */}
                  <div className="flex items-center gap-3 mb-3">
                    <p className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                      {formatDate(dateKey + 'T00:00:00')}
                    </p>
                    <div className="flex-1 h-px bg-slate-200" />
                    <span className="text-xs text-slate-400 whitespace-nowrap">
                      {dayMovements.length} {dayMovements.length === 1 ? 'movimentação' : 'movimentações'}
                    </span>
                  </div>

                  {/* Movements for this day */}
                  <div className="space-y-2 relative">
                    {/* Timeline line */}
                    <div className="absolute left-[28px] top-9 bottom-9 w-px bg-slate-100" />

                    {dayMovements.map((movement) => (
                      <div key={movement.id} className="relative">
                        {loadingDetail === movement.id && (
                          <div className="absolute inset-0 rounded-xl bg-white/70 flex items-center justify-center z-10">
                            <svg className="animate-spin w-4 h-4 text-wine-700" xmlns="http://www.w3.org/2000/svg"
                              fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10"
                                stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          </div>
                        )}
                        <MovementItem
                          movement={movement}
                          onDetail={handleMovementDetail}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <BazarSaleDrawer sale={drawerSale} onClose={() => setDrawerSale(null)} />
    </div>
  );
}
