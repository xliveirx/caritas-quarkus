'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import { api } from '@/services/api';
import { Field, inputClass, EyeIcon } from '@/components/ui/field';
import type { ApiErrorResponse } from '@/shared/types/api-error-response';


/* ─── Types ──────────────────────────────────────────────────────── */

interface UserResponse {
  id: number;
  name: string;
  email: string;
}

interface FormState {
  name: string;
  password: string;
  confirmPassword: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

/* ─── Props ──────────────────────────────────────────────────────── */

interface Props {
  open: boolean;
  onClose: () => void;
}

/* ─── Component ──────────────────────────────────────────────────── */

export function ProfileModal({ open, onClose }: Props) {
  const { token } = useAuth();
  const toast = useToast();

  const [profile, setProfile]           = useState<UserResponse | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [form, setForm]                 = useState<FormState>({ name: '', password: '', confirmPassword: '' });
  const [errors, setErrors]             = useState<FormErrors>({});
  const [isPending, setIsPending]       = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);

  /* ── Fetch profile on open ──────────────────────────────────────── */
  useEffect(() => {
    if (!open || !token) return;
    setIsLoadingProfile(true);
    setErrors({});
    setForm({ name: '', password: '', confirmPassword: '' });
    setShowPassword(false);
    setShowConfirm(false);

    api.get<UserResponse>('/api/v1/users', token)
      .then((data) => {
        setProfile(data);
        setForm((f) => ({ ...f, name: data.name ?? '' }));
      })
      .catch((err) => {
        const apiErr = err as ApiErrorResponse;
        toast.error(apiErr?.title ?? 'Erro ao carregar perfil', apiErr?.message);
        onClose();
      })
      .finally(() => setIsLoadingProfile(false));
  }, [open, token]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Escape key ─────────────────────────────────────────────────── */
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
    if (form.password) {
      if (form.password.length < 8) e.password = 'Mínimo 8 caracteres';
      if (!form.confirmPassword) e.confirmPassword = 'Confirmação obrigatória';
      else if (form.password !== form.confirmPassword) e.confirmPassword = 'As senhas não coincidem';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate() || !token) return;
    setIsPending(true);

    const payload: Record<string, string> = {};
    if (form.name.trim() && form.name.trim() !== profile?.name) payload.name = form.name.trim();
    if (form.password) {
      payload.password = form.password;
      payload.confirmPassword = form.confirmPassword;
    }

    if (Object.keys(payload).length === 0) {
      toast.success('Sem alterações', 'Nenhuma informação foi modificada.');
      onClose();
      return;
    }

    try {
      await api.put<UserResponse>('/api/v1/users', payload, token);
      toast.success('Perfil atualizado!', 'Suas informações foram salvas com sucesso.');
      onClose();
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      const detail = apiErr?.errors?.map((v) => `${v.field}: ${v.message}`).join(' · ');
      toast.error(apiErr?.title ?? 'Erro ao atualizar perfil', detail || apiErr?.message);
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
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
          <div>
            <h2 className="text-base font-bold text-slate-900">Editar perfil</h2>
            <p className="text-xs text-slate-500 mt-0.5">Atualize suas informações de acesso</p>
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

        {/* Body */}
        {isLoadingProfile ? (
          <div className="flex items-center justify-center py-14">
            <svg className="animate-spin w-6 h-6 text-wine-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="px-6 py-5 space-y-4">

              {/* Email (read-only) */}
              <Field label="E-mail">
                <input
                  type="email"
                  value={profile?.email ?? ''}
                  disabled
                  className={inputClass + ' bg-slate-50 text-slate-400'}
                />
              </Field>

              {/* Name */}
              <Field label="Nome" error={errors.name}>
                <input
                  type="text"
                  placeholder="Seu nome"
                  disabled={isPending}
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  className={inputClass}
                />
              </Field>

              {/* Divider */}
              <div className="flex items-center gap-2 pt-1">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs font-medium text-slate-400">Alterar senha (opcional)</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Password */}
              <Field label="Nova senha" error={errors.password}>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 8 caracteres"
                    disabled={isPending}
                    value={form.password}
                    onChange={(e) => set('password', e.target.value)}
                    className={inputClass + ' pr-10'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
              </Field>

              {/* Confirm password */}
              <Field label="Confirmar nova senha" error={errors.confirmPassword}>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Repita a nova senha"
                    disabled={isPending}
                    value={form.confirmPassword}
                    onChange={(e) => set('confirmPassword', e.target.value)}
                    className={inputClass + ' pr-10'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    aria-label={showConfirm ? 'Ocultar senha' : 'Mostrar senha'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <EyeIcon open={showConfirm} />
                  </button>
                </div>
              </Field>

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
                    Salvando...
                  </>
                ) : 'Salvar alterações'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
