'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import { api } from '@/services/api';
import { Field, inputClass } from '@/components/ui/field';
import type { VolunteerResponse } from '@/shared/types/volunteer-response';
import type { ParishResponse } from '@/shared/types/parish-response';
import type { ApiErrorResponse } from '@/shared/types/api-error-response';

/* ─── Types ──────────────────────────────────────────────────────── */

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: (volunteer: VolunteerResponse) => void;
  volunteer?: VolunteerResponse;
  /** Pass parishes list for ADMIN to allow parish selection */
  parishes?: ParishResponse[];
  /** When true, parishId field is visible */
  isAdmin: boolean;
  /** When set, parish selector is hidden and this value is used */
  lockedParishId?: number;
}

interface FormState {
  name: string;
  email: string;
  parishId: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

/* ─── Modal ──────────────────────────────────────────────────────── */

export function VolunteerModal({ open, onClose, onSaved, volunteer, parishes, isAdmin, lockedParishId }: Props) {
  const isEdit = !!volunteer;
  const { token } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState<FormState>({
    name: '', email: '', parishId: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        name: volunteer?.name ?? '',
        email: volunteer?.email ?? '',
        parishId: volunteer?.parishId?.toString() ?? lockedParishId?.toString() ?? '',
      });
      setErrors({});
    }
  }, [open, volunteer]);

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
    const e: FormErrors = {};
    if (!isEdit) {
      if (!form.name.trim()) e.name = 'Nome obrigatório';
      if (!form.email.trim()) e.email = 'E-mail obrigatório';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'E-mail inválido';
    } else {
      if (!form.name.trim()) e.name = 'Nome obrigatório';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate() || !token) return;
    setIsPending(true);
    try {
      let result: VolunteerResponse;
      const parishId = form.parishId ? Number(form.parishId) : null;

      if (isEdit) {
        result = await api.put<VolunteerResponse>(
          `/api/v1/volunteers/${volunteer!.id}`,
          { name: form.name.trim() },
          token
        );
        toast.success('Voluntário atualizado!', `"${result.name}" foi atualizado com sucesso.`);
      } else {
        result = await api.post<VolunteerResponse>(
          '/api/v1/volunteers',
          {
            name: form.name.trim(),
            email: form.email.trim(),
            parishId: isAdmin ? parishId : null,
          },
          token
        );
        toast.success('Voluntário cadastrado!', `"${result.name}" foi adicionado com sucesso.`);
      }
      onSaved(result);
      onClose();
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      const detail = apiErr?.errors?.map((v) => `${v.field}: ${v.message}`).join(' · ');
      toast.error(
        apiErr?.title ?? (isEdit ? 'Erro ao atualizar voluntário' : 'Erro ao cadastrar voluntário'),
        detail || apiErr?.message
      );
    } finally {
      setIsPending(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => { if (!isPending) onClose(); }}
        aria-hidden="true"
      />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90dvh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {isEdit ? 'Editar voluntário' : 'Novo voluntário'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEdit ? 'Atualize os dados do voluntário' : 'Preencha os dados do novo voluntário'}
            </p>
          </div>
          <button
            onClick={() => { if (!isPending) onClose(); }}
            aria-label="Fechar"
            disabled={isPending}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100
              transition-colors duration-150 disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="w-5 h-5">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="px-6 py-5 space-y-4">

            <Field label="Nome" required={!isEdit} error={errors.name}>
              <input
                type="text" placeholder="Maria Souza" disabled={isPending}
                value={form.name} onChange={(e) => set('name', e.target.value)}
                className={inputClass}
              />
            </Field>

            {!isEdit && (
              <Field label="E-mail" required error={errors.email}>
                <input
                  type="email" placeholder="maria@paroquia.org" disabled={isPending}
                  value={form.email} onChange={(e) => set('email', e.target.value)}
                  className={inputClass}
                />
              </Field>
            )}

            {isAdmin && !lockedParishId && !isEdit && parishes && parishes.length > 0 && (
              <Field label="Paróquia" error={errors.parishId}>
                <select
                  value={form.parishId}
                  onChange={(e) => set('parishId', e.target.value)}
                  disabled={isPending}
                  className={inputClass}
                >
                  <option value="">Nenhuma (opcional)</option>
                  {parishes.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </Field>
            )}

          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
            <button
              type="button"
              onClick={() => { if (!isPending) onClose(); }}
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
              ) : (isEdit ? 'Salvar alterações' : 'Cadastrar voluntário')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
