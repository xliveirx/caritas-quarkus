'use client';

import { useEffect, useState, useCallback, type FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import { api } from '@/services/api';
import { CoordinatorModal } from '@/components/coordinator-modal';
import { VolunteerModal } from '@/components/volunteer-modal';
import { Field, inputClass } from '@/components/ui/field';
import { SkeletonRow } from '@/components/ui/skeleton-row';
import { Pagination } from '@/components/ui/pagination';
import { StatusBadge } from '@/components/ui/status-badge';
import { ConfirmToggleModal } from '@/components/ui/confirm-toggle-modal';
import { maskCNPJ, maskCEP, rawDigits, formatDate } from '@/shared/utils/formatters';
import type { ParishResponse } from '@/shared/types/parish-response';
import type { ParishUpdateRequest } from '@/shared/types/parish-update-request';
import type { CoordinatorResponse } from '@/shared/types/coordinator-response';
import type { VolunteerResponse } from '@/shared/types/volunteer-response';
import type { PaginatedResponse } from '@/shared/types/paginated-response';
import type { ApiErrorResponse } from '@/shared/types/api-error-response';


const PAGE_SIZE = 10;



/* ─── Action Buttons ─────────────────────────────────────────────── */

function ActionButtons({ name, active, canActivate = true, onEdit, onToggle, editLoading = false, toggleLoading = false }: {
  name: string; active: boolean; canActivate?: boolean; onEdit: () => void; onToggle: () => void;
  editLoading?: boolean; toggleLoading?: boolean;
}) {
  return (
    <div className="flex items-center gap-1 justify-end">
      <button
        type="button"
        aria-label={`Editar ${name}`}
        onClick={onEdit}
        disabled={!active || editLoading || toggleLoading}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600
          hover:bg-slate-100 transition-colors duration-150
          focus:outline-none focus-visible:ring-2 focus-visible:ring-wine-700
          disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {editLoading ? (
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
        aria-label={active ? `Inativar ${name}` : `Ativar ${name}`}
        onClick={onToggle}
        disabled={toggleLoading || editLoading || (!active && !canActivate)}
        title={active ? 'Inativar' : canActivate ? 'Ativar' : 'Usuário sem senha definida'}
        className={[
          'p-1.5 rounded-lg transition-colors duration-150',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-wine-700',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          active
            ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
            : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50',
        ].join(' ')}
      >
        {toggleLoading ? (
          <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : active ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className="w-4 h-4">
            <circle cx="12" cy="12" r="10" />
            <line x1="10" y1="15" x2="10" y2="9" />
            <line x1="14" y1="15" x2="14" y2="9" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className="w-4 h-4">
            <circle cx="12" cy="12" r="10" />
            <polygon points="10 8 16 12 10 16 10 8" />
          </svg>
        )}
      </button>
    </div>
  );
}


/* ─── Parish Edit Form ───────────────────────────────────────────── */

interface ParishFormState {
  name: string; cnpj: string; street: string; number: string;
  complement: string; city: string; state: string; postalCode: string;
}

function ParishEditForm({
  parish, token, onUpdated,
}: {
  parish: ParishResponse;
  token: string;
  onUpdated: (p: ParishResponse) => void;
}) {
  const toast = useToast();

  const [form, setForm] = useState<ParishFormState>({
    name: parish.name,
    cnpj: maskCNPJ(parish.cnpj),
    street: parish.address.street,
    number: String(parish.address.number),
    complement: parish.address.complement ?? '',
    city: parish.address.city,
    state: parish.address.state,
    postalCode: maskCEP(parish.address.postalCode),
  });
  const [errors, setErrors] = useState<Partial<ParishFormState>>({});
  const [isPending, setIsPending] = useState(false);

  function set(field: keyof ParishFormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validate(): boolean {
    const e: Partial<ParishFormState> = {};
    if (form.cnpj && rawDigits(form.cnpj).length !== 14) e.cnpj = 'CNPJ inválido (14 dígitos)';
    if (form.number && isNaN(Number(form.number))) e.number = 'Número inválido';
    if (form.state && form.state.trim().length !== 2) e.state = 'Use a sigla do estado (ex: RS)';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setIsPending(true);
    try {
      const hasAddress = form.street.trim() || form.number.trim() || form.city.trim() ||
        form.state.trim() || form.postalCode.trim();

      const payload: ParishUpdateRequest = {
        ...(form.name.trim() ? { name: form.name.trim() } : {}),
        ...(form.cnpj && rawDigits(form.cnpj).length === 14 ? { cnpj: rawDigits(form.cnpj) } : {}),
        ...(hasAddress ? {
          address: {
            ...(form.street.trim() ? { street: form.street.trim() } : {}),
            ...(form.number.trim() ? { number: Number(form.number) } : {}),
            ...(form.complement.trim() ? { complement: form.complement.trim() } : {}),
            ...(form.city.trim() ? { city: form.city.trim() } : {}),
            ...(form.state.trim() ? { state: form.state.trim().toUpperCase() } : {}),
            ...(form.postalCode.trim() ? { postalCode: rawDigits(form.postalCode) } : {}),
          },
        } : {}),
      };
      const updated = await api.put<ParishResponse>(`/api/v1/parishes/${parish.id}`, payload, token);
      toast.success('Paróquia atualizada!', `"${updated.name}" foi salva com sucesso.`);
      onUpdated(updated);
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      const detail = apiErr?.errors?.map((v) => `${v.field}: ${v.message}`).join(' · ');
      toast.error(apiErr?.title ?? 'Erro ao atualizar paróquia', detail || apiErr?.message);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Field label="Nome da Paróquia" error={errors.name}>
              <input
                type="text" placeholder="Paróquia São João" disabled={isPending}
                value={form.name} onChange={(e) => set('name', e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>
          <div className="col-span-2">
            <Field label="CNPJ" error={errors.cnpj}>
              <input
                type="text" placeholder="00.000.000/0000-00" disabled={isPending}
                value={form.cnpj} onChange={(e) => set('cnpj', maskCNPJ(e.target.value))}
                className={inputClass}
              />
            </Field>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs font-medium text-slate-400">Endereço</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <Field label="Logradouro" error={errors.street}>
              <input
                type="text" placeholder="Rua das Flores" disabled={isPending}
                value={form.street} onChange={(e) => set('street', e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>
          <Field label="Número" error={errors.number}>
            <input
              type="text" placeholder="123" disabled={isPending}
              value={form.number} onChange={(e) => set('number', e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Complemento" error={errors.complement}>
          <input
            type="text" placeholder="Sala 2, Bloco A (opcional)" disabled={isPending}
            value={form.complement} onChange={(e) => set('complement', e.target.value)}
            className={inputClass}
          />
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-1">
            <Field label="Cidade" error={errors.city}>
              <input
                type="text" placeholder="Caxias do Sul" disabled={isPending}
                value={form.city} onChange={(e) => set('city', e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>
          <Field label="Estado" error={errors.state}>
            <input
              type="text" placeholder="RS" maxLength={2} disabled={isPending}
              value={form.state} onChange={(e) => set('state', e.target.value.toUpperCase())}
              className={inputClass}
            />
          </Field>
          <Field label="CEP" error={errors.postalCode}>
            <input
              type="text" placeholder="95000-000" disabled={isPending}
              value={form.postalCode} onChange={(e) => set('postalCode', maskCEP(e.target.value))}
              className={inputClass}
            />
          </Field>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white
            bg-wine-800 hover:bg-wine-900 rounded-lg
            transition-colors duration-150
            focus:outline-none focus-visible:ring-2 focus-visible:ring-wine-700
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Salvando...
            </>
          ) : 'Salvar alterações'}
        </button>
      </div>
    </form>
  );
}

/* ─── Page ───────────────────────────────────────────────────────── */

export default function ParishDetailPage() {
  const params  = useParams();
  const router  = useRouter();
  const { user, token } = useAuth();
  const toast   = useToast();

  const parishId = Number(params.id);
  const isAdmin  = user?.roles.includes('ADMIN') ?? false;

  /* ── Parish ─────────────────────────────────────────────────────── */
  const [parish, setParish]         = useState<ParishResponse | null>(null);
  const [parishLoading, setParishLoading] = useState(true);
  const [parishError, setParishError] = useState<{ title: string; message?: string } | null>(null);

  /* ── Coordinators (ADMIN only) ──────────────────────────────────── */
  const [coordinators, setCoordinators]       = useState<CoordinatorResponse[]>([]);
  const [coordTotal, setCoordTotal]           = useState(0);
  const [coordPages, setCoordPages]           = useState(0);
  const [coordPage, setCoordPage]             = useState(0);
  const [coordLoading, setCoordLoading]       = useState(true);
  const [coordModalOpen, setCoordModalOpen]     = useState(false);
  const [editCoordinator, setEditCoordinator]   = useState<CoordinatorResponse | undefined>(undefined);
  const [togglingCoordId, setTogglingCoordId]   = useState<number | null>(null);
  const [coordToToggle, setCoordToToggle]       = useState<CoordinatorResponse | null>(null);
  const [loadingEditCoordId, setLoadingEditCoordId] = useState<number | null>(null);

  /* ── Volunteers ─────────────────────────────────────────────────── */
  const [volunteers, setVolunteers]         = useState<VolunteerResponse[]>([]);
  const [volTotal, setVolTotal]             = useState(0);
  const [volPages, setVolPages]             = useState(0);
  const [volPage, setVolPage]               = useState(0);
  const [volLoading, setVolLoading]         = useState(true);
  const [volModalOpen, setVolModalOpen]       = useState(false);
  const [editVolunteer, setEditVolunteer]     = useState<VolunteerResponse | undefined>(undefined);
  const [togglingVolId, setTogglingVolId]     = useState<number | null>(null);
  const [volToToggle, setVolToToggle]         = useState<VolunteerResponse | null>(null);
  const [loadingEditVolId, setLoadingEditVolId] = useState<number | null>(null);

  /* ── Role guard ─────────────────────────────────────────────────── */
  useEffect(() => {
    if (user && !user.roles.includes('ADMIN') && !user.roles.includes('COORDINATOR')) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  /* ── Fetch parish ────────────────────────────────────────────────── */
  useEffect(() => {
    if (!token || !parishId) return;
    setParishLoading(true);
    setParishError(null);
    api.get<ParishResponse>(`/api/v1/parishes/${parishId}`, token)
      .then(setParish)
      .catch((err) => {
        const apiErr = err as ApiErrorResponse;
        setParishError({
          title: apiErr?.title ?? 'Erro ao carregar paróquia',
          message: apiErr?.message,
        });
      })
      .finally(() => setParishLoading(false));
  }, [token, parishId]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Fetch coordinators ──────────────────────────────────────────── */
  const fetchCoordinators = useCallback(
    async (currentPage: number) => {
      if (!token || !isAdmin || !parishId) return;
      setCoordLoading(true);
      try {
        const data = await api.get<PaginatedResponse<CoordinatorResponse>>(
          `/api/v1/coordinators/parish/${parishId}?page=${currentPage}&size=${PAGE_SIZE}`,
          token
        );
        setCoordinators(data.data);
        setCoordTotal(data.pagination.totalItems);
        setCoordPages(data.pagination.totalPages);
      } catch (err) {
        const apiErr = err as ApiErrorResponse;
        toast.error(apiErr?.title ?? 'Erro ao carregar coordenadores', apiErr?.message);
      } finally {
        setCoordLoading(false);
      }
    },
    [token, isAdmin, parishId, toast]
  );

  /* ── Fetch volunteers ────────────────────────────────────────────── */
  const fetchVolunteers = useCallback(
    async (currentPage: number) => {
      if (!token || !parishId) return;
      setVolLoading(true);
      try {
        const data = await api.get<PaginatedResponse<VolunteerResponse>>(
          `/api/v1/volunteers/parish/${parishId}?page=${currentPage}&size=${PAGE_SIZE}`,
          token
        );
        setVolunteers(data.data);
        setVolTotal(data.pagination.totalItems);
        setVolPages(data.pagination.totalPages);
      } catch (err) {
        const apiErr = err as ApiErrorResponse;
        toast.error(apiErr?.title ?? 'Erro ao carregar voluntários', apiErr?.message);
      } finally {
        setVolLoading(false);
      }
    },
    [token, parishId, toast]
  );

  useEffect(() => { fetchCoordinators(coordPage); }, [fetchCoordinators, coordPage]);
  useEffect(() => { fetchVolunteers(volPage); }, [fetchVolunteers, volPage]);

  /* ── Coordinator handlers ────────────────────────────────────────── */

  async function handleToggleCoordinator() {
    if (!coordToToggle || !token) return;
    const coord = coordToToggle;
    setTogglingCoordId(coord.id);
    const action = coord.active ? 'deactivate' : 'activate';
    try {
      await api.patch(`/api/v1/coordinators/${action}/${coord.id}`, token);
      setCoordinators((prev) =>
        prev.map((c) => c.id === coord.id ? { ...c, active: !c.active } : c)
      );
      toast.success(
        coord.active ? 'Coordenador inativado' : 'Coordenador ativado',
        `"${coord.name}" foi ${coord.active ? 'inativado' : 'ativado'} com sucesso.`
      );
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      toast.error(apiErr?.title ?? 'Erro ao atualizar coordenador', apiErr?.message);
    } finally {
      setTogglingCoordId(null);
      setCoordToToggle(null);
    }
  }

  function handleCoordinatorSaved(saved: CoordinatorResponse) {
    if (editCoordinator) {
      setCoordinators((prev) => prev.map((c) => c.id === saved.id ? saved : c));
    } else {
      if (coordPage === 0) {
        setCoordinators((prev) => [saved, ...prev.slice(0, PAGE_SIZE - 1)]);
        setCoordTotal((n) => n + 1);
      } else {
        setCoordPage(0);
      }
    }
    setEditCoordinator(undefined);
  }

  /* ── Volunteer handlers ──────────────────────────────────────────── */

  async function handleToggleVolunteer() {
    if (!volToToggle || !token) return;
    const vol = volToToggle;
    setTogglingVolId(vol.id);
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
      setTogglingVolId(null);
      setVolToToggle(null);
    }
  }

  function handleVolunteerSaved(saved: VolunteerResponse) {
    if (editVolunteer) {
      setVolunteers((prev) => prev.map((v) => v.id === saved.id ? saved : v));
    } else {
      if (volPage === 0) {
        setVolunteers((prev) => [saved, ...prev.slice(0, PAGE_SIZE - 1)]);
        setVolTotal((n) => n + 1);
      } else {
        setVolPage(0);
      }
    }
    setEditVolunteer(undefined);
  }

  /* ── Fetch-first edit openers ────────────────────────────────────── */

  async function openEditCoordinator(coord: CoordinatorResponse) {
    if (!token) return;
    setLoadingEditCoordId(coord.id);
    try {
      const fresh = await api.get<CoordinatorResponse>(`/api/v1/coordinators/${coord.id}`, token);
      setEditCoordinator(fresh);
      setCoordModalOpen(true);
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      toast.error(apiErr?.title ?? 'Erro ao carregar coordenador', apiErr?.message);
    } finally {
      setLoadingEditCoordId(null);
    }
  }

  async function openEditVolunteer(vol: VolunteerResponse) {
    if (!token) return;
    setLoadingEditVolId(vol.id);
    try {
      const fresh = await api.get<VolunteerResponse>(`/api/v1/volunteers/${vol.id}`, token);
      setEditVolunteer(fresh);
      setVolModalOpen(true);
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      toast.error(apiErr?.title ?? 'Erro ao carregar voluntário', apiErr?.message);
    } finally {
      setLoadingEditVolId(null);
    }
  }

  /* ── Loading state ───────────────────────────────────────────────── */
  if (parishLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse mb-6" />
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  /* ── Error state ─────────────────────────────────────────────────── */
  if (parishError) {
    return (
      <div className="p-6 max-w-7xl mx-auto flex items-center justify-center min-h-[60dvh]">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
              className="w-7 h-7 text-red-600">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">{parishError.title}</h2>
            {parishError.message && (
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">{parishError.message}</p>
            )}
          </div>
          {isAdmin && (
            <button
              onClick={() => router.push('/paroquias')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white
                bg-wine-800 hover:bg-wine-900 rounded-lg transition-colors duration-150
                focus:outline-none focus-visible:ring-2 focus-visible:ring-wine-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className="w-4 h-4">
                <path d="m15 18-6-6 6-6" />
              </svg>
              Voltar para paróquias
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!parish) return null;

  /* ── Render ─────────────────────────────────────────────────────── */

  return (
    <>
      <div className="p-6 max-w-7xl mx-auto space-y-8">

        {/* ── Header ───────────────────────────────────────────────── */}
        <div className="flex items-start gap-4">
          {isAdmin && (
            <button
              onClick={() => router.push('/paroquias')}
              aria-label="Voltar para paróquias"
              className="mt-0.5 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100
                transition-colors duration-150 shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className="w-5 h-5">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
          )}
          <div>
            {isAdmin && (
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">
                Paróquias
              </p>
            )}
            <h1 className="text-xl font-bold text-slate-900">{parish.name}</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {parish.address.city} / {parish.address.state}
              {' · '}Cadastro em {formatDate(parish.createdAt)}
            </p>
          </div>
        </div>

        {/* ── Parish edit form (ADMIN only) ─────────────────────────── */}
        {isAdmin && (
          <section>
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">
              Dados da paróquia
            </h2>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <ParishEditForm
                parish={parish}
                token={token!}
                onUpdated={setParish}
              />
            </div>
          </section>
        )}

        {/* ── Coordinators section (ADMIN only) ─────────────────────── */}
        {isAdmin && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                  Coordenadores
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Responsáveis por esta paróquia</p>
              </div>
              <div className="flex items-center gap-3">
                {!coordLoading && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold
                    bg-wine-50 text-wine-800 border border-wine-100">
                    {coordTotal} {coordTotal === 1 ? 'coordenador' : 'coordenadores'}
                  </span>
                )}
                <button
                  onClick={() => { setEditCoordinator(undefined); setCoordModalOpen(true); }}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white
                    bg-wine-800 hover:bg-wine-900 rounded-lg transition-colors duration-150
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-wine-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    className="w-4 h-4">
                    <path d="M5 12h14M12 5v14" />
                  </svg>
                  Novo coordenador
                </button>
              </div>
            </div>

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
                    {coordLoading ? (
                      Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} widths={[55, 45, 35, 28, 20]} />)
                    ) : coordinators.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-12 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                              stroke="currentColor" strokeWidth="1.5" className="w-9 h-9 text-slate-300">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                              <circle cx="12" cy="7" r="4" />
                            </svg>
                            <p className="text-sm font-medium text-slate-500">
                              Nenhum coordenador nesta paróquia
                            </p>
                            <button
                              onClick={() => { setEditCoordinator(undefined); setCoordModalOpen(true); }}
                              className="text-xs text-wine-700 hover:text-wine-800 font-semibold underline underline-offset-2"
                            >
                              Adicionar coordenador
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      coordinators.map((coord) => (
                        <tr key={coord.id} className="hover:bg-slate-50 transition-colors duration-100">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-wine-100 flex items-center justify-center shrink-0">
                                <span className="text-wine-800 font-bold text-xs">
                                  {coord.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <span className="font-medium text-slate-900">{coord.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-slate-600 text-xs">{coord.email}</td>
                          <td className="px-5 py-4"><StatusBadge active={coord.active} /></td>
                          <td className="px-5 py-4 text-slate-500 text-xs whitespace-nowrap">
                            {formatDate(coord.createdAt)}
                          </td>
                          <td className="px-5 py-4">
                            <ActionButtons
                              name={coord.name}
                              active={coord.active}
                              canActivate={coord.hasPassword}
                              onEdit={() => openEditCoordinator(coord)}
                              onToggle={() => setCoordToToggle(coord)}
                              editLoading={loadingEditCoordId === coord.id}
                              toggleLoading={togglingCoordId === coord.id}
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={coordPage} totalPages={coordPages}
                totalItems={coordTotal} pageSize={PAGE_SIZE}
                onPage={setCoordPage}
              />
            </div>
          </section>
        )}

        {/* ── Volunteers section (ADMIN + COORDINATOR) ───────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                Voluntários
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Colaboradores desta paróquia</p>
            </div>
            <div className="flex items-center gap-3">
              {!volLoading && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold
                  bg-wine-50 text-wine-800 border border-wine-100">
                  {volTotal} {volTotal === 1 ? 'voluntário' : 'voluntários'}
                </span>
              )}
              <button
                onClick={() => { setEditVolunteer(undefined); setVolModalOpen(true); }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white
                  bg-wine-800 hover:bg-wine-900 rounded-lg transition-colors duration-150
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
                  {volLoading ? (
                    Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} widths={[55, 45, 35, 28, 20]} />)
                  ) : volunteers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="1.5" className="w-9 h-9 text-slate-300">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                          </svg>
                          <p className="text-sm font-medium text-slate-500">
                            Nenhum voluntário nesta paróquia
                          </p>
                          <button
                            onClick={() => { setEditVolunteer(undefined); setVolModalOpen(true); }}
                            className="text-xs text-wine-700 hover:text-wine-800 font-semibold underline underline-offset-2"
                          >
                            Adicionar voluntário
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    volunteers.map((vol) => (
                      <tr key={vol.id} className="hover:bg-slate-50 transition-colors duration-100">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
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
                          <ActionButtons
                            name={vol.name}
                            active={vol.active}
                            canActivate={vol.hasPassword}
                            onEdit={() => openEditVolunteer(vol)}
                            onToggle={() => setVolToToggle(vol)}
                            editLoading={loadingEditVolId === vol.id}
                            toggleLoading={togglingVolId === vol.id}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              page={volPage} totalPages={volPages}
              totalItems={volTotal} pageSize={PAGE_SIZE}
              onPage={setVolPage}
            />
          </div>
        </section>

      </div>

      {/* ── Coordinator modals ─────────────────────────────────────── */}
      <CoordinatorModal
        open={coordModalOpen}
        onClose={() => { setCoordModalOpen(false); setEditCoordinator(undefined); }}
        onSaved={handleCoordinatorSaved}
        coordinator={editCoordinator}
        parishes={[]}
        lockedParishId={parishId}
      />

      {/* ── Volunteer modals ───────────────────────────────────────── */}
      <VolunteerModal
        open={volModalOpen}
        onClose={() => { setVolModalOpen(false); setEditVolunteer(undefined); }}
        onSaved={handleVolunteerSaved}
        volunteer={editVolunteer}
        isAdmin={isAdmin}
        lockedParishId={parishId}
      />

      {coordToToggle && (
        <ConfirmToggleModal
          name={coordToToggle.name}
          active={coordToToggle.active}
          entityLabel="coordenador"
          isPending={togglingCoordId === coordToToggle.id}
          onConfirm={handleToggleCoordinator}
          onCancel={() => setCoordToToggle(null)}
        />
      )}

      {volToToggle && (
        <ConfirmToggleModal
          name={volToToggle.name}
          active={volToToggle.active}
          entityLabel="voluntário"
          isPending={togglingVolId === volToToggle.id}
          onConfirm={handleToggleVolunteer}
          onCancel={() => setVolToToggle(null)}
        />
      )}
    </>
  );
}
