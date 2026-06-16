'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { inputClass } from '@/components/ui/field';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import { api } from '@/services/api';
import { getParishFromToken } from '@/shared/utils/token';
import type { VisitResponse, VisitStatus } from '@/shared/types/visit-response';
import type { ParishResponse } from '@/shared/types/parish-response';
import type { PaginatedResponse } from '@/shared/types/paginated-response';
import type { ApiErrorResponse } from '@/shared/types/api-error-response';

/* ─── Constants ──────────────────────────────────────────────────── */

const MONTH_NAMES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];
const WEEK_DAYS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

const STATUS_CHIP: Record<VisitStatus, string> = {
  SCHEDULED: 'bg-amber-50 text-amber-800 border-amber-200',
  COMPLETED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  CANCELED:  'bg-slate-100 text-slate-400 border-slate-200',
};
const STATUS_DOT: Record<VisitStatus, string> = {
  SCHEDULED: 'bg-amber-500',
  COMPLETED: 'bg-emerald-500',
  CANCELED:  'bg-slate-400',
};
const STATUS_LABEL: Record<VisitStatus, string> = {
  SCHEDULED: 'Agendada',
  COMPLETED: 'Concluída',
  CANCELED:  'Cancelada',
};
const STATUS_BADGE: Record<VisitStatus, string> = {
  SCHEDULED: 'bg-amber-50 text-amber-700 border border-amber-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  CANCELED:  'bg-slate-100 text-slate-500 border border-slate-200',
};

/* ─── Helpers ────────────────────────────────────────────────────── */

function getResponsible(family: VisitResponse['family']): string {
  return family.members.find((m) => m.responsible)?.name ?? `Família #${family.id}`;
}

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatFullDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });
}

function generateCalendarDays(year: number, month: number) {
  const firstWeekDay  = new Date(year, month - 1, 1).getDay();
  const daysInMonth   = new Date(year, month, 0).getDate();
  const daysInPrev    = new Date(year, month - 1, 0).getDate();

  const days: { date: Date; current: boolean }[] = [];

  for (let i = firstWeekDay - 1; i >= 0; i--)
    days.push({ date: new Date(year, month - 2, daysInPrev - i), current: false });

  for (let d = 1; d <= daysInMonth; d++)
    days.push({ date: new Date(year, month - 1, d), current: true });

  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++)
    days.push({ date: new Date(year, month, d), current: false });

  return days;
}

function groupByDay(visits: VisitResponse[]): Map<string, VisitResponse[]> {
  const map = new Map<string, VisitResponse[]>();
  for (const v of visits) {
    const key = v.scheduledDate.slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(v);
  }
  return map;
}

/* ─── Visit Detail Modal ─────────────────────────────────────────── */

function VisitDetailModal({ visit, onClose }: { visit: VisitResponse | null; onClose: () => void }) {
  useEffect(() => {
    if (!visit) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [visit, onClose]);

  if (!visit) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">

        {/* Colored top bar */}
        <div className={[
          'h-1.5 w-full',
          visit.status === 'SCHEDULED' ? 'bg-amber-400' :
          visit.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-slate-300',
        ].join(' ')} />

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-4 pb-3">
          <div>
            <span className={[
              'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold',
              STATUS_BADGE[visit.status],
            ].join(' ')}>
              <span className={['w-1.5 h-1.5 rounded-full', STATUS_DOT[visit.status]].join(' ')} />
              {STATUS_LABEL[visit.status]}
            </span>
          </div>
          <button onClick={onClose} aria-label="Fechar"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100
              transition-colors duration-150 -mt-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="w-4 h-4"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pb-5 space-y-4">

          {/* Date & time */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-wine-50 border border-wine-100 flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className="w-4 h-4 text-wine-700">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 leading-none mb-0.5">Data</p>
              <p className="text-sm font-semibold text-slate-800 capitalize">
                {formatFullDate(visit.scheduledDate)}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">às {formatTime(visit.scheduledDate)}</p>
            </div>
          </div>

          <div className="border-t border-slate-100" />

          {/* Family */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className="w-4 h-4 text-slate-500">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 leading-none mb-0.5">Família</p>
              <p className="text-sm font-semibold text-slate-800">{getResponsible(visit.family)}</p>
            </div>
          </div>

          {/* Responsible */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className="w-4 h-4 text-slate-500">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 leading-none mb-0.5">Responsável</p>
              <p className="text-sm font-semibold text-slate-800">{visit.user.name}</p>
            </div>
          </div>

          {/* Reason */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Motivo</p>
            <p className="text-sm text-slate-700 leading-relaxed">{visit.reason}</p>
          </div>

          {/* Link to family visits */}
          <Link
            href={`/visitas/${visit.family.id}`}
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-semibold
              text-wine-700 bg-wine-50 border border-wine-100 rounded-xl
              hover:bg-wine-100 transition-colors duration-150"
          >
            Ver histórico da família
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              className="w-3.5 h-3.5">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ─── Calendar Cell ──────────────────────────────────────────────── */

const MAX_VISIBLE = 2;

function CalendarCell({
  date, current, dayVisits, today, onVisitClick,
}: {
  date: Date;
  current: boolean;
  dayVisits: VisitResponse[];
  today: string;
  onVisitClick: (v: VisitResponse) => void;
}) {
  const key = toDateKey(date);
  const isToday = key === today;
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? dayVisits : dayVisits.slice(0, MAX_VISIBLE);
  const overflow = dayVisits.length - MAX_VISIBLE;

  return (
    <div className={[
      'min-h-[80px] p-1.5 border-b border-r border-slate-200 flex flex-col',
      current ? 'bg-white' : 'bg-slate-50/60',
    ].join(' ')}>
      {/* Day number */}
      <div className="flex justify-end mb-1 pr-0.5">
        <span className={[
          'w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold',
          isToday
            ? 'bg-wine-800 text-white'
            : current
              ? 'text-slate-700'
              : 'text-slate-300',
        ].join(' ')}>
          {date.getDate()}
        </span>
      </div>

      {/* Events */}
      <div className="flex flex-col gap-0.5 flex-1">
        {visible.map((visit) => (
          <button
            key={visit.id}
            type="button"
            onClick={() => onVisitClick(visit)}
            className={[
              'w-full text-left flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold',
              'border truncate transition-colors duration-100',
              STATUS_CHIP[visit.status],
              'hover:brightness-95',
            ].join(' ')}
            title={`${formatTime(visit.scheduledDate)} — ${getResponsible(visit.family)}`}
          >
            <span className={['w-1.5 h-1.5 rounded-full shrink-0', STATUS_DOT[visit.status]].join(' ')} />
            <span className="truncate">{formatTime(visit.scheduledDate)} {getResponsible(visit.family)}</span>
          </button>
        ))}

        {!showAll && overflow > 0 && (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="text-[10px] font-semibold text-slate-400 hover:text-wine-700
              transition-colors duration-100 text-left pl-1.5 mt-0.5"
          >
            +{overflow} mais
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────── */

export default function AgendaPage() {
  const { token, user } = useAuth();
  const toast = useToast();
  const isAdmin = user?.roles.includes('ADMIN') ?? false;

  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const [parishes, setParishes]           = useState<ParishResponse[]>([]);
  const [selectedParishId, setSelectedParishId] = useState('');
  const [loadingParishes, setLoadingParishes]   = useState(false);

  const [visits, setVisits]       = useState<VisitResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<VisitResponse | null>(null);

  const today = toDateKey(now);

  /* ── Load parishes for admin ──────────────────────────────────── */
  useEffect(() => {
    if (!isAdmin || !token) return;
    setLoadingParishes(true);
    api.get<PaginatedResponse<ParishResponse>>('/api/v1/parishes?page=0&size=200', token)
      .then((res) => setParishes(res.data.filter((p) => !p.isDiocese)))
      .catch(() => toast.error('Erro ao carregar paróquias', 'Tente novamente.'))
      .finally(() => setLoadingParishes(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, token]);

  /* ── Fetch visits ─────────────────────────────────────────────── */
  const fetchVisits = useCallback(async () => {
    if (!token) return;
    if (isAdmin && !selectedParishId) return;

    setIsLoading(true);
    try {
      const parishId = isAdmin
        ? selectedParishId
        : String(getParishFromToken(token) ?? '');

      const qs = new URLSearchParams({ month: String(month), year: String(year) });
      if (parishId) qs.set('parishId', parishId);

      const data = await api.get<VisitResponse[]>(
        `/api/v1/visits/calendar?${qs}`, token
      );
      setVisits(data);
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      toast.error(apiErr?.title ?? 'Erro ao carregar agenda', apiErr?.message);
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, month, year, selectedParishId, isAdmin]);

  useEffect(() => { fetchVisits(); }, [fetchVisits]);

  /* ── Navigation ───────────────────────────────────────────────── */
  function prevMonth() {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }
  function goToday() {
    setMonth(now.getMonth() + 1);
    setYear(now.getFullYear());
  }

  const calendarDays = generateCalendarDays(year, month);
  const visitsByDay  = groupByDay(visits);
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  const scheduledCount = visits.filter((v) => v.status === 'SCHEDULED').length;

  /* ─────────────────────────────────────────────────────────────── */

  return (
    <>
      <div className="p-6 max-w-7xl mx-auto flex flex-col gap-5">

        {/* Page header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Agenda</h1>
            <p className="text-sm text-slate-500 mt-0.5">Calendário de visitas agendadas</p>
          </div>

          {/* Month navigation */}
          <div className="flex items-center gap-2">
            {!isCurrentMonth && (
              <button
                onClick={goToday}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white
                  border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors duration-150"
              >
                Hoje
              </button>
            )}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <button
                onClick={prevMonth}
                className="p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-800
                  transition-colors duration-150"
                aria-label="Mês anterior"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  className="w-4 h-4"><path d="m15 18-6-6 6-6" /></svg>
              </button>
              <span className="px-3 text-sm font-bold text-slate-800 min-w-[150px] text-center select-none">
                {MONTH_NAMES[month - 1]} {year}
              </span>
              <button
                onClick={nextMonth}
                className="p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-800
                  transition-colors duration-150"
                aria-label="Próximo mês"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  className="w-4 h-4"><path d="m9 18 6-6-6-6" /></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Parish selector — admin only */}
        {isAdmin && (
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold tracking-wider text-slate-600 uppercase mb-1.5">
                Paróquia
              </label>
              <select
                value={selectedParishId}
                onChange={(e) => setSelectedParishId(e.target.value)}
                disabled={loadingParishes}
                className={inputClass}
              >
                <option value="">{loadingParishes ? 'Carregando...' : 'Selecione uma paróquia'}</option>
                {parishes.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            {selectedParishId && !isLoading && (
              <div className="pt-6 shrink-0">
                <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg
                  text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  {scheduledCount} agendada{scheduledCount !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Calendar */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

          {/* Week days header */}
          <div className="grid grid-cols-7 border-b border-slate-200">
            {WEEK_DAYS.map((d) => (
              <div key={d} className="px-2 py-2 text-center text-xs font-bold text-slate-400
                uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>

          {/* Empty state for admin without parish */}
          {isAdmin && !selectedParishId ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                  className="w-7 h-7 text-slate-400">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">Selecione uma paróquia</p>
                <p className="text-xs text-slate-400 mt-0.5">As visitas agendadas aparecerão aqui</p>
              </div>
            </div>
          ) : isLoading ? (
            /* Loading skeleton */
            <div className="grid grid-cols-7">
              {Array.from({ length: 42 }).map((_, i) => (
                <div key={i} className="min-h-[80px] p-2 border-b border-r border-slate-200 animate-pulse">
                  <div className="flex justify-end mb-2">
                    <div className="w-6 h-6 rounded-full bg-slate-200" />
                  </div>
                  {i % 5 === 0 && <div className="h-5 rounded-md bg-slate-100 mb-1" />}
                  {i % 7 === 2 && <div className="h-5 rounded-md bg-slate-100" />}
                </div>
              ))}
            </div>
          ) : (
            /* Calendar grid */
            <div className="grid grid-cols-7">
              {calendarDays.map(({ date, current }, idx) => (
                <CalendarCell
                  key={idx}
                  date={date}
                  current={current}
                  dayVisits={visitsByDay.get(toDateKey(date)) ?? []}
                  today={today}
                  onVisitClick={setSelectedVisit}
                />
              ))}
            </div>
          )}

          {/* Legend */}
          {(!isAdmin || selectedParishId) && !isLoading && (
            <div className="flex items-center gap-4 px-4 py-3 border-t border-slate-100 bg-slate-50/60">
              {(['SCHEDULED', 'COMPLETED', 'CANCELED'] as VisitStatus[]).map((s) => (
                <div key={s} className="flex items-center gap-1.5">
                  <span className={['w-2 h-2 rounded-full', STATUS_DOT[s]].join(' ')} />
                  <span className="text-xs text-slate-500">{STATUS_LABEL[s]}</span>
                </div>
              ))}
              {visits.length > 0 && (
                <span className="ml-auto text-xs text-slate-400">
                  {visits.length} visita{visits.length !== 1 ? 's' : ''} neste mês
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <VisitDetailModal visit={selectedVisit} onClose={() => setSelectedVisit(null)} />
    </>
  );
}
