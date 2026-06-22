'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { DashboardResponse } from '@/shared/types/dashboard-response';
import type { ParishResponse } from '@/shared/types/parish-response';
import type { PaginatedResponse } from '@/shared/types/paginated-response';
import type { ApiErrorResponse } from '@/shared/types/api-error-response';

/* ─── Helpers ────────────────────────────────────────────────────── */

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const MONTH_NAMES = [
  'Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez',
];

const VISIT_STATUS_LABEL: Record<string, string> = {
  SCHEDULED: 'Agendada',
  COMPLETED:  'Concluída',
  CANCELED:   'Cancelada',
};

const VISIT_STATUS_COLOR: Record<string, string> = {
  SCHEDULED: 'bg-amber-100 text-amber-700',
  COMPLETED:  'bg-emerald-100 text-emerald-700',
  CANCELED:   'bg-red-100 text-red-600',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/* ─── Stat card ──────────────────────────────────────────────────── */

function StatCard({
  label, value, sub, color, icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-slate-900 leading-none">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

/* ─── Section heading ────────────────────────────────────────────── */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{children}</p>
  );
}

/* ─── Page ───────────────────────────────────────────────────────── */

export default function DashboardPage() {
  const { token, user } = useAuth();
  const isAdmin = user?.roles.includes('ADMIN') ?? false;

  const [data, setData]               = useState<DashboardResponse | null>(null);
  const [isLoading, setIsLoading]     = useState(true);
  const [fetchError, setFetchError]   = useState(false);

  const [parishes, setParishes]               = useState<ParishResponse[]>([]);
  const [selectedParishId, setSelectedParishId] = useState('');

  const currentMonthName = MONTH_NAMES[new Date().getMonth()];

  useEffect(() => {
    if (!isAdmin || !token) return;
    api.get<PaginatedResponse<ParishResponse>>('/api/v1/parishes?page=0&size=200', token)
      .then((res) => setParishes(res.data))
      .catch(() => {});
  }, [isAdmin, token]);

  const fetchDashboard = useCallback(async () => {
    if (!token) return;
    if (isAdmin && !selectedParishId) { setIsLoading(false); return; }
    setIsLoading(true);
    setFetchError(false);
    try {
      const qs = isAdmin && selectedParishId ? `?parishId=${selectedParishId}` : '';
      const result = await api.get<DashboardResponse>(`/api/v1/dashboard${qs}`, token);
      setData(result);
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      if (apiErr?.status !== 401) setFetchError(true);
    } finally {
      setIsLoading(false);
    }
  }, [token, isAdmin, selectedParishId]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  /* ── Chart data ── */
  const donationChartData = data ? [
    {
      name: 'Total',
      Entradas: data.totalDonationEntries,
      Saídas:   data.totalDonationExits,
    },
    {
      name: currentMonthName,
      Entradas: data.totalMonthDonationEntries,
      Saídas:   data.totalMonthDonationExits,
    },
  ] : [];

  const teamChartData = data ? [
    { name: 'Coordenadores', value: data.totalParishCoordinators, fill: '#6b1335' },
    { name: 'Voluntários',   value: data.totalParishVolunteers,   fill: '#fbbf24' },
  ] : [];

  /* ── Skeleton ── */
  if (isLoading && (!isAdmin || selectedParishId)) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-6 animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-slate-100" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-64 rounded-2xl bg-slate-100" />
          <div className="h-64 rounded-2xl bg-slate-100" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-64 rounded-2xl bg-slate-100" />
          <div className="h-64 rounded-2xl bg-slate-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Visão geral da paróquia</p>
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

      {/* Admin — no parish selected */}
      {isAdmin && !selectedParishId && (
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 text-slate-300">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          <p className="text-sm font-medium text-slate-500">Selecione uma paróquia para ver o dashboard</p>
        </div>
      )}

      {/* Error */}
      {fetchError && (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 text-slate-300">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-sm font-medium text-slate-500">Não foi possível carregar o dashboard.</p>
          <button onClick={fetchDashboard}
            className="text-xs font-semibold text-wine-700 hover:text-wine-800 underline underline-offset-2">
            Tentar novamente
          </button>
        </div>
      )}

      {/* Content */}
      {!fetchError && data && (
        <>
          {/* ── Stat cards ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Famílias"
              value={data.totalFamilies}
              color="bg-wine-100"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                  className="w-6 h-6 text-wine-800">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              }
            />
            <StatCard
              label="Saldo do caixa"
              value={BRL.format(data.cashRegister.balance)}
              color={data.cashRegister.balance >= 0 ? 'bg-emerald-50' : 'bg-red-50'}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                  className={`w-6 h-6 ${data.cashRegister.balance >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  <rect x="2" y="7" width="20" height="14" rx="2" />
                  <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                  <line x1="12" y1="12" x2="12" y2="16" /><line x1="10" y1="14" x2="14" y2="14" />
                </svg>
              }
            />
            <StatCard
              label="Entradas"
              value={data.totalDonationEntries}
              sub={`${data.totalMonthDonationEntries} em ${currentMonthName}`}
              color="bg-emerald-50"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                  className="w-6 h-6 text-emerald-600">
                  <path d="M12 19V5M5 12l7-7 7 7" />
                </svg>
              }
            />
            <StatCard
              label="Saídas"
              value={data.totalDonationExits}
              sub={`${data.totalMonthDonationExits} em ${currentMonthName}`}
              color="bg-red-50"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                  className="w-6 h-6 text-red-500">
                  <path d="M12 5v14M5 12l7 7 7-7" />
                </svg>
              }
            />
          </div>

          {/* ── Charts row ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Donations bar chart */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <SectionTitle>Doações — total vs {currentMonthName}</SectionTitle>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={donationChartData} barCategoryGap="35%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }}
                    cursor={{ fill: '#f8fafc' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                  <Bar dataKey="Entradas" fill="#10b981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Saídas"   fill="#f43f5e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Team + bazar */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-6">
              <div>
                <SectionTitle>Equipe</SectionTitle>
                <div className="space-y-3">
                  {teamChartData.map((item) => (
                    <div key={item.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-slate-600">{item.name}</span>
                        <span className="text-xs font-bold text-slate-800">{item.value}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, (item.value / Math.max(1, data.totalParishCoordinators + data.totalParishVolunteers)) * 100)}%`,
                            backgroundColor: item.fill,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <SectionTitle>Bazar — {currentMonthName}</SectionTitle>
                <div className="flex items-end gap-3">
                  <p className="text-3xl font-bold text-slate-900">{data.totalMonthSales}</p>
                  <p className="text-sm text-slate-400 mb-1">vendas este mês</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Lists row ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Last visits */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <SectionTitle>Últimas visitas</SectionTitle>
              {data.lastVisits.length === 0 ? (
                <p className="text-sm text-slate-400 py-8 text-center">Nenhuma visita registrada</p>
              ) : (
                <div className="space-y-2">
                  {data.lastVisits.map((v) => (
                    <div key={v.id}
                      className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {v.family.members.find((m) => m.responsible)?.name ?? '—'}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">{formatDate(v.scheduledDate)}</p>
                      </div>
                      <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${VISIT_STATUS_COLOR[v.status]}`}>
                        {VISIT_STATUS_LABEL[v.status] ?? v.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent bazar sales */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <SectionTitle>Vendas recentes — bazar</SectionTitle>
              {data.recentSales.length === 0 ? (
                <p className="text-sm text-slate-400 py-8 text-center">Nenhuma venda registrada</p>
              ) : (
                <div className="space-y-2">
                  {data.recentSales.map((s) => (
                    <div key={s.id}
                      className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{s.buyerName}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {formatDate(s.soldAt)} · {s.items.length} {s.items.length === 1 ? 'item' : 'itens'}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-bold text-emerald-600">{BRL.format(s.total)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
