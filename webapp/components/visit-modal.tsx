'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import { api } from '@/services/api';
import { Field, inputClass } from '@/components/ui/field';
import { getParishFromToken } from '@/shared/utils/token';
import type { FamilyResponse } from '@/shared/types/family-response';
import type { VolunteerResponse } from '@/shared/types/volunteer-response';
import type { CoordinatorResponse } from '@/shared/types/coordinator-response';
import type { VisitResponse } from '@/shared/types/visit-response';
import type { PaginatedResponse } from '@/shared/types/paginated-response';
import type { ApiErrorResponse } from '@/shared/types/api-error-response';

interface UserOption {
  id: number;
  name: string;
  role: 'Voluntário' | 'Coordenador';
}

interface Props {
  open: boolean;
  family: FamilyResponse | null;
  onClose: () => void;
  onCreated: () => void;
  visit?: VisitResponse;
  onSaved?: () => void;
}

interface FormState {
  userId: string;
  scheduledDate: string;
  reason: string;
}

const emptyForm: FormState = { userId: '', scheduledDate: '', reason: '' };

function minDateTime(): string {
  return new Date(Date.now() + 60_000).toISOString().slice(0, 16);
}

export function VisitModal({ open, family, onClose, onCreated, visit, onSaved }: Props) {
  const { user, token } = useAuth();
  const toast = useToast();
  const isAdmin = user?.roles.includes('ADMIN') ?? false;
  const isEdit = !!visit;

  const [form, setForm]           = useState<FormState>(emptyForm);
  const [errors, setErrors]       = useState<Partial<FormState>>({});
  const [users, setUsers]         = useState<UserOption[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (open) {
      if (visit) {
        setForm({
          userId: String(visit.user.id),
          scheduledDate: visit.scheduledDate.slice(0, 16),
          reason: visit.reason,
        });
      } else {
        setForm(emptyForm);
      }
      setErrors({});
    }
  }, [open, visit]);

  useEffect(() => {
    if (!open || !token) return;

    const parishId = isEdit
      ? (isAdmin ? visit!.parish.id : getParishFromToken(token))
      : (isAdmin ? family?.parishId : getParishFromToken(token));

    if (!parishId) return;

    setIsLoadingUsers(true);

    Promise.all([
      api.get<PaginatedResponse<VolunteerResponse>>(
        `/api/v1/volunteers/parish/${parishId}?page=0&size=200&active=true`,
        token
      ),
      api.get<PaginatedResponse<CoordinatorResponse>>(
        `/api/v1/coordinators/parish/${parishId}?page=0&size=200`,
        token
      ),
    ])
      .then(([volunteers, coordinators]) => {
        const merged: UserOption[] = [
          ...volunteers.data.map((v) => ({ id: v.id, name: v.name, role: 'Voluntário' as const })),
          ...coordinators.data.filter((c) => c.active).map((c) => ({ id: c.id, name: c.name, role: 'Coordenador' as const })),
        ].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
        setUsers(merged);
      })
      .catch(() => setUsers([]))
      .finally(() => setIsLoadingUsers(false));
  }, [open, family, visit, token, isAdmin, isEdit]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && !isPending) onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, isPending, onClose]);

  function set(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validate(): boolean {
    const e: Partial<FormState> = {};
    if (isEdit) {
      if (!form.userId) e.userId = 'Selecione um responsável';
      if (!form.reason.trim()) e.reason = 'Motivo obrigatório';
      if (form.scheduledDate) {
        const originalDate = visit!.scheduledDate.slice(0, 16);
        if (form.scheduledDate !== originalDate && new Date(form.scheduledDate) <= new Date()) {
          e.scheduledDate = 'A data deve ser no futuro';
        }
      }
    } else {
      if (!form.userId) e.userId = 'Selecione um responsável';
      if (!form.scheduledDate) {
        e.scheduledDate = 'Data obrigatória';
      } else if (new Date(form.scheduledDate) <= new Date()) {
        e.scheduledDate = 'A data deve ser no futuro';
      }
      if (!form.reason.trim()) e.reason = 'Motivo obrigatório';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate() || !token) return;
    setIsPending(true);
    try {
      if (isEdit) {
        const body: Record<string, unknown> = {};
        const originalDate = visit!.scheduledDate.slice(0, 16);
        if (form.scheduledDate && form.scheduledDate !== originalDate) {
          body.scheduledDate = `${form.scheduledDate}:00`;
        }
        if (form.userId !== String(visit!.user.id)) {
          body.userId = Number(form.userId);
        }
        if (form.reason.trim() !== visit!.reason) {
          body.reason = form.reason.trim();
        }
        if (Object.keys(body).length === 0) {
          toast.error('Nenhuma alteração', 'Nenhum campo foi modificado.');
          return;
        }
        await api.put<VisitResponse>(`/api/v1/visits/${visit!.id}`, body, token);
        toast.success('Visita atualizada!', 'As informações foram salvas com sucesso.');
        onSaved?.();
        onClose();
      } else {
        if (!family) return;
        await api.post<VisitResponse>('/api/v1/visits', {
          familyId: family.id,
          userId: Number(form.userId),
          scheduledDate: `${form.scheduledDate}:00`,
          reason: form.reason.trim(),
        }, token);
        toast.success('Visita agendada!', 'A visita foi registrada com sucesso.');
        onCreated();
        onClose();
      }
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      const detail = apiErr?.errors?.map((v) => `${v.field}: ${v.message}`).join(' · ');
      toast.error(
        apiErr?.title ?? (isEdit ? 'Erro ao atualizar visita' : 'Erro ao agendar visita'),
        detail || apiErr?.message
      );
    } finally {
      setIsPending(false);
    }
  }

  const responsible = family?.members.find((m) => m.responsible);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => { if (!isPending) onClose(); }}
        aria-hidden="true"
      />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {isEdit ? 'Editar Visita' : 'Nova Visita'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEdit ? 'Altere os campos que deseja atualizar' : 'Agendar visita à família'}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isPending}
            aria-label="Fechar"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100
              transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="w-5 h-5">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="px-6 py-5 space-y-4">

            {!isEdit && (
              <div className="px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-0.5">Família</p>
                <p className="text-sm font-medium text-slate-800">
                  {responsible?.name ?? `Família #${family?.id}`}
                </p>
              </div>
            )}

            <Field label="Responsável pela visita" required={!isEdit} error={errors.userId}>
              <select
                value={form.userId}
                onChange={(e) => set('userId', e.target.value)}
                disabled={isPending || isLoadingUsers}
                className={inputClass}
              >
                <option value="">
                  {isLoadingUsers ? 'Carregando...' : 'Selecione um responsável'}
                </option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} — {u.role}</option>
                ))}
              </select>
            </Field>

            <Field label="Data agendada" required={!isEdit} error={errors.scheduledDate}>
              <input
                type="datetime-local"
                value={form.scheduledDate}
                onChange={(e) => set('scheduledDate', e.target.value)}
                disabled={isPending}
                min={minDateTime()}
                className={inputClass}
              />
            </Field>

            <Field label="Motivo" required={!isEdit} error={errors.reason}>
              <textarea
                value={form.reason}
                onChange={(e) => set('reason', e.target.value)}
                disabled={isPending}
                rows={3}
                placeholder="Descreva o motivo da visita..."
                className={`${inputClass} resize-none`}
              />
            </Field>
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800
                rounded-lg hover:bg-slate-200 transition-colors duration-150
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white
                bg-wine-800 hover:bg-wine-900 rounded-lg transition-colors duration-150
                focus:outline-none focus-visible:ring-2 focus-visible:ring-wine-700
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {isEdit ? 'Salvando...' : 'Agendando...'}
                </>
              ) : (isEdit ? 'Salvar alterações' : 'Agendar visita')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
