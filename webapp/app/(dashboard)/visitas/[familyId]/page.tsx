'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import { api } from '@/services/api';
import { VisitModal } from '@/components/visit-modal';
import { FamilyDetailsModal } from '@/components/family-details-modal';
import { ConfirmDeleteModal } from '@/components/ui/confirm-delete-modal';
import { formatDateTime } from '@/shared/utils/formatters';
import { SITUATION_LABELS, type Situation } from '@/shared/types/situation';
import type { FamilyResponse } from '@/shared/types/family-response';
import type { VisitResponse, VisitStatus } from '@/shared/types/visit-response';
import type { PaginatedResponse } from '@/shared/types/paginated-response';
import type { ApiErrorResponse } from '@/shared/types/api-error-response';

const PAGE_SIZE = 10;

/* ─── Status config ──────────────────────────────────────────────── */

const STATUS_LABEL: Record<VisitStatus, string> = {
  SCHEDULED: 'Agendada',
  COMPLETED: 'Concluída',
  CANCELED:  'Cancelada',
};

const STATUS_BADGE: Record<VisitStatus, string> = {
  SCHEDULED: 'bg-amber-50 text-amber-700 border border-amber-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  CANCELED:  'bg-red-50 text-red-600 border border-red-200',
};

const DOT_COLOR: Record<VisitStatus, string> = {
  SCHEDULED: 'bg-amber-400',
  COMPLETED: 'bg-emerald-500',
  CANCELED:  'bg-red-400',
};

const DOT_RING: Record<VisitStatus, string> = {
  SCHEDULED: 'ring-amber-400/25',
  COMPLETED: 'ring-emerald-500/25',
  CANCELED:  'ring-red-400/25',
};

const SITUATION_COLORS: Record<Situation, string> = {
  RISCO_BAIXO:       'bg-emerald-50 text-emerald-700 border-emerald-100',
  RISCO_MEDIO:       'bg-amber-50 text-amber-700 border-amber-100',
  RISCO_ALTO:        'bg-orange-50 text-orange-700 border-orange-100',
  POBREZA_EXTREMA:   'bg-red-50 text-red-700 border-red-100',
  EMERGENCIA_SOCIAL: 'bg-purple-50 text-purple-700 border-purple-100',
};

/* ─── Timeline skeleton ──────────────────────────────────────────── */

function TimelineSkeleton() {
  return (
    <div className="relative">
      <div className="absolute left-3.5 top-0 bottom-0 w-0.5 bg-slate-200" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="relative flex gap-5 pb-8">
          <div className="relative z-10 mt-0.5 w-7 h-7 shrink-0 rounded-full bg-slate-200 animate-pulse border-2 border-white" />
          <div className="flex-1 bg-white border border-slate-200 rounded-xl p-4 space-y-2 animate-pulse">
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <div className="h-3 w-32 bg-slate-200 rounded" />
                <div className="h-3 w-24 bg-slate-100 rounded" />
              </div>
              <div className="h-5 w-20 bg-slate-200 rounded-full" />
            </div>
            <div className="h-3 w-full bg-slate-100 rounded mt-3" />
            <div className="h-3 w-4/5 bg-slate-100 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────── */

export default function FamilyVisitsPage() {
  const params   = useParams();
  const router   = useRouter();
  const { token } = useAuth();
  const toast    = useToast();

  const familyId = Number(params.familyId);

  const [family, setFamily]       = useState<FamilyResponse | null>(null);
  const [visits, setVisits]       = useState<VisitResponse[]>([]);
  const [page, setPage]           = useState(0);
  const [hasMore, setHasMore]     = useState(false);
  const [isLoadingFamily, setIsLoadingFamily] = useState(true);
  const [isLoadingVisits, setIsLoadingVisits] = useState(true);
  const [isLoadingMore, setIsLoadingMore]     = useState(false);
  const [familyError, setFamilyError]         = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editVisit, setEditVisit] = useState<VisitResponse | null>(null);
  const [familyDetailsOpen, setFamilyDetailsOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<VisitStatus | ''>('');
  const [confirmAction, setConfirmAction] = useState<{ type: 'complete' | 'cancel'; visitId: number } | null>(null);
  const [isActioning, setIsActioning] = useState(false);
  const didFetch = useRef(false);

  /* ── Fetch family ───────────────────────────────────────────────── */
  useEffect(() => {
    if (!token || !familyId) return;
    setIsLoadingFamily(true);
    api.get<FamilyResponse>(`/api/v1/families/${familyId}`, token)
      .then(setFamily)
      .catch(() => setFamilyError(true))
      .finally(() => setIsLoadingFamily(false));
  }, [token, familyId]);

  /* ── Fetch visits ───────────────────────────────────────────────── */
  async function fetchVisits(pageNum: number, append = false) {
    if (!token) return;
    append ? setIsLoadingMore(true) : setIsLoadingVisits(true);
    try {
      const data = await api.get<PaginatedResponse<VisitResponse>>(
        `/api/v1/visits/family/${familyId}?page=${pageNum}&size=${PAGE_SIZE}`,
        token
      );
      setVisits((prev) => append ? [...prev, ...data.data] : data.data);
      setPage(pageNum);
      setHasMore(pageNum + 1 < data.pagination.totalPages);
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      toast.error(apiErr?.title ?? 'Erro ao carregar visitas', apiErr?.message);
    } finally {
      setIsLoadingVisits(false);
      setIsLoadingMore(false);
    }
  }

  useEffect(() => {
    if (!token || !familyId || didFetch.current) return;
    didFetch.current = true;
    fetchVisits(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, familyId]);

  /* ── Created / Saved ───────────────────────────────────────────── */
  function handleCreated() {
    setPage(0);
    setHasMore(false);
    fetchVisits(0);
  }

  function handleSaved() {
    fetchVisits(0);
  }

  /* ── Change status ──────────────────────────────────────────────── */
  async function handleStatusChange() {
    if (!confirmAction || !token) return;
    setIsActioning(true);
    try {
      const endpoint = confirmAction.type === 'complete'
        ? `/api/v1/visits/conclude/${confirmAction.visitId}`
        : `/api/v1/visits/cancel/${confirmAction.visitId}`;
      await api.patch<VisitResponse>(endpoint, token);
      toast.success(
        confirmAction.type === 'complete' ? 'Visita concluída!' : 'Visita cancelada!',
        confirmAction.type === 'complete'
          ? 'A visita foi marcada como concluída.'
          : 'A visita foi cancelada com sucesso.'
      );
      fetchVisits(0);
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      toast.error(apiErr?.title ?? 'Erro ao atualizar visita', apiErr?.message);
    } finally {
      setIsActioning(false);
      setConfirmAction(null);
    }
  }

  const responsible = family?.members.find((m) => m.responsible);

  const filteredVisits = statusFilter
    ? visits.filter((v) => v.status === statusFilter)
    : visits;

  /* ── Back URL ───────────────────────────────────────────────────── */
  const backHref = family
    ? `/visitas?paroquia=${family.parishId}`
    : '/visitas';

  /* ─────────────────────────────────────────────────────────────── */

  if (familyError) {
    return (
      <div className="p-6 max-w-3xl mx-auto flex flex-col items-center justify-center py-24 text-center">
        <p className="text-sm font-medium text-slate-700 mb-3">Família não encontrada</p>
        <button onClick={() => router.back()}
          className="text-xs text-wine-700 hover:text-wine-900 font-semibold underline underline-offset-2">
          Voltar
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="p-6 max-w-3xl mx-auto">

        {/* Back */}
        <button
          onClick={() => router.push(backHref)}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500
            hover:text-slate-800 transition-colors duration-150 mb-5 group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform duration-150">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Voltar às famílias
        </button>

        {/* Family card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-8 shadow-sm">
          {isLoadingFamily ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-5 w-48 bg-slate-200 rounded" />
              <div className="h-3.5 w-32 bg-slate-100 rounded" />
            </div>
          ) : family ? (
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-wine-50 border border-wine-100
                  flex items-center justify-center shrink-0">
                  <span className="text-wine-700 font-bold text-lg">
                    {responsible?.name.charAt(0).toUpperCase() ?? '?'}
                  </span>
                </div>
                <div>
                  <h1 className="text-base font-bold text-slate-900">
                    {responsible?.name ?? `Família #${family.id}`}
                  </h1>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={[
                      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border',
                      SITUATION_COLORS[family.situation],
                    ].join(' ')}>
                      {SITUATION_LABELS[family.situation]}
                    </span>
                    <span className="text-xs text-slate-400">
                      {family.members.length} {family.members.length === 1 ? 'membro' : 'membros'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFamilyDetailsOpen(true)}
                    className="mt-2 flex items-center gap-1 text-xs font-semibold text-wine-700
                      hover:text-wine-900 underline underline-offset-2 transition-colors duration-150"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      className="w-3.5 h-3.5">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v-4M12 8h.01" />
                    </svg>
                    Ver detalhes da família
                  </button>
                </div>
              </div>

              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white
                  bg-wine-800 hover:bg-wine-900 rounded-xl shrink-0
                  transition-colors duration-150
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-wine-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  className="w-4 h-4">
                  <path d="M5 12h14M12 5v14" />
                </svg>
                Nova visita
              </button>
            </div>
          ) : null}
        </div>

        {/* Section header + status filter */}
        <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
            Histórico de visitas
          </h2>
          <div className="flex items-center gap-1.5">
            {(['', 'SCHEDULED', 'COMPLETED', 'CANCELED'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={[
                  'px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors duration-150',
                  statusFilter === s
                    ? 'bg-wine-800 text-white border-wine-800'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50',
                ].join(' ')}
              >
                {s === '' ? 'Todas' : STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline */}
        {isLoadingVisits ? (
          <TimelineSkeleton />
        ) : filteredVisits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                className="w-6 h-6 text-slate-400">
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                <line x1="16" x2="16" y1="2" y2="6" />
                <line x1="8" x2="8" y1="2" y2="6" />
                <line x1="3" x2="21" y1="10" y2="10" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">
              {statusFilter
                ? `Nenhuma visita com status "${STATUS_LABEL[statusFilter]}"`
                : 'Nenhuma visita registrada'}
            </p>
            {!statusFilter && (
              <button
                onClick={() => setModalOpen(true)}
                className="text-xs text-wine-700 hover:text-wine-900 font-semibold
                  underline underline-offset-2 mt-1"
              >
                Agendar a primeira visita
              </button>
            )}
          </div>
        ) : (
          <div className="relative">
            {/* Vertical timeline line */}
            <div className="absolute left-3.5 top-3 bottom-3 w-0.5 bg-slate-200 rounded-full" />

            <div className="space-y-0">
              {filteredVisits.map((visit, idx) => (
                <div key={visit.id} className="relative flex gap-5 pb-5">
                  {/* Dot */}
                  <div className={[
                    'relative z-10 mt-0.5 w-7 h-7 shrink-0 rounded-full border-[3px] border-white',
                    'ring-4 flex items-center justify-center',
                    DOT_COLOR[visit.status],
                    DOT_RING[visit.status],
                  ].join(' ')}>
                    {visit.status === 'COMPLETED' && (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                        stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                        className="w-3 h-3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                    {visit.status === 'CANCELED' && (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                        stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                        className="w-3 h-3">
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                    )}
                    {visit.status === 'SCHEDULED' && (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                        stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                        className="w-3 h-3">
                        <circle cx="12" cy="12" r="4" fill="white" stroke="none" />
                      </svg>
                    )}
                  </div>

                  {/* Card */}
                  <div className={[
                    'flex-1 bg-white rounded-2xl border shadow-sm overflow-hidden',
                    'transition-shadow duration-150 hover:shadow-md',
                    visit.status === 'SCHEDULED' ? 'border-amber-100' :
                    visit.status === 'COMPLETED' ? 'border-emerald-100' :
                    'border-red-100',
                  ].join(' ')}>

                    {/* Card top bar */}
                    <div className={[
                      'px-4 pt-3 pb-2.5 flex items-start justify-between gap-3',
                      visit.status === 'SCHEDULED' ? 'bg-amber-50/50' :
                      visit.status === 'COMPLETED' ? 'bg-emerald-50/50' :
                      'bg-red-50/30',
                    ].join(' ')}>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">
                          {visit.status === 'SCHEDULED' ? 'Agendada para' :
                           visit.status === 'COMPLETED' ? 'Realizada em' : 'Cancelada'}
                        </p>
                        <p className="text-sm font-bold text-slate-800">
                          {formatDateTime(
                            visit.status === 'COMPLETED' && visit.completedDate
                              ? visit.completedDate
                              : visit.scheduledDate
                          )}
                        </p>
                        {visit.status === 'COMPLETED' && visit.completedDate && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            Agendada: {formatDateTime(visit.scheduledDate)}
                          </p>
                        )}
                      </div>
                      <span className={[
                        'shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold',
                        STATUS_BADGE[visit.status],
                      ].join(' ')}>
                        {STATUS_LABEL[visit.status]}
                      </span>
                    </div>

                    {/* Card body */}
                    <div className="px-4 py-3 space-y-3">
                      {/* Responsible */}
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                          <span className="text-slate-500 font-bold text-[10px]">
                            {visit.user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 leading-none mb-0.5">
                            Responsável
                          </p>
                          <p className="text-sm font-medium text-slate-800">{visit.user.name}</p>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="border-t border-slate-100" />

                      {/* Reason */}
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                          Motivo
                        </p>
                        <p className="text-sm text-slate-700 leading-relaxed">{visit.reason}</p>
                      </div>

                      {/* Recorded at */}
                      <p className="text-[10px] text-slate-400 pt-0.5">
                        Registrada em {formatDateTime(visit.createdAt)}
                      </p>
                    </div>

                    {/* Actions — SCHEDULED only */}
                    {visit.status === 'SCHEDULED' && (
                      <div className="px-4 py-3 border-t border-amber-100 bg-amber-50/30 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setConfirmAction({ type: 'complete', visitId: visit.id })}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold
                            text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg
                            hover:bg-emerald-100 transition-colors duration-150
                            focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                            className="w-3.5 h-3.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          Concluir
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmAction({ type: 'cancel', visitId: visit.id })}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold
                            text-red-600 bg-red-50 border border-red-200 rounded-lg
                            hover:bg-red-100 transition-colors duration-150
                            focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                            className="w-3.5 h-3.5">
                            <path d="M18 6 6 18M6 6l12 12" />
                          </svg>
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditVisit(visit)}
                          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold
                            text-slate-600 bg-white border border-slate-200 rounded-lg
                            hover:bg-slate-50 hover:border-slate-300 transition-colors duration-150
                            focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                            className="w-3.5 h-3.5">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                          Editar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Load more */}
            {hasMore && !statusFilter && (
              <div className="flex justify-center mt-2 pl-12">
                <button
                  onClick={() => fetchVisits(page + 1, true)}
                  disabled={isLoadingMore}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-slate-600
                    bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:bg-slate-50
                    transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingMore ? (
                    <>
                      <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Carregando...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        className="w-4 h-4">
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                      Carregar mais
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <FamilyDetailsModal
        open={familyDetailsOpen}
        family={family}
        onClose={() => setFamilyDetailsOpen(false)}
      />

      <VisitModal
        open={modalOpen}
        family={family}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreated}
      />

      <VisitModal
        open={!!editVisit}
        family={family}
        visit={editVisit ?? undefined}
        onClose={() => setEditVisit(null)}
        onCreated={handleCreated}
        onSaved={handleSaved}
      />

      {confirmAction?.type === 'complete' && (
        <ConfirmDeleteModal
          title="Concluir visita"
          description="Confirma que a visita foi realizada? O status será atualizado para concluída."
          isPending={isActioning}
          confirmLabel="Concluir"
          confirmClassName="bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-500"
          iconBg="bg-emerald-100"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              className="w-5 h-5 text-emerald-600">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          }
          onConfirm={handleStatusChange}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {confirmAction?.type === 'cancel' && (
        <ConfirmDeleteModal
          title="Cancelar visita"
          description="Tem certeza que deseja cancelar esta visita? O status será atualizado para cancelada."
          isPending={isActioning}
          confirmLabel="Cancelar visita"
          onConfirm={handleStatusChange}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </>
  );
}
