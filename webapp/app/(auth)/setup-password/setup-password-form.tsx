'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '@/services/api';
import type { ApiErrorResponse } from '@/shared/types/api-error-response';

function EyeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className="w-4 h-4">
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className="w-4 h-4">
      <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
      <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
      <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
      <path d="m2 2 20 20" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function PasswordField({
  id, label, value, show, disabled,
  error, onChange, onToggleShow,
}: {
  id: string; label: string; value: string; show: boolean; disabled: boolean;
  error?: string; onChange: (v: string) => void; onToggleShow: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id}
        className="block text-xs font-semibold tracking-widest text-slate-600 uppercase">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          autoComplete={id === 'password' ? 'new-password' : 'new-password'}
          required
          placeholder="••••••••"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={[
            'w-full px-3.5 py-3 pr-11 text-sm text-slate-900 placeholder-slate-400',
            'border rounded-lg bg-white transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-wine-700 focus:border-wine-700',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error ? 'border-red-400 focus:ring-red-500 focus:border-red-500' : 'border-slate-300',
          ].join(' ')}
        />
        <button
          type="button"
          aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
          onClick={onToggleShow}
          disabled={disabled}
          className="absolute right-3 top-1/2 -translate-y-1/2
            text-slate-400 hover:text-slate-600 transition-colors duration-150
            focus:outline-none focus-visible:ring-2 focus-visible:ring-wine-700 rounded
            disabled:cursor-not-allowed"
        >
          {show ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      {error && (
        <p className="text-xs text-red-600 font-medium">{error}</p>
      )}
    </div>
  );
}

export function SetupPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isTokenExpired, setIsTokenExpired] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  if (!token || !email) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-slate-50 px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-8 py-10 flex flex-col items-center text-center gap-4">
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
                <h1 className="text-base font-bold text-slate-900">Link inválido ou expirado</h1>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                  Este link de configuração não é válido. Solicite um novo convite ao seu coordenador.
                </p>
              </div>
              <Link
                href="/login"
                className="text-sm font-semibold text-wine-700 hover:text-wine-800 transition-colors duration-150"
              >
                Ir para o login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-slate-50 px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-8 py-10 flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className="w-7 h-7 text-emerald-600">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-900">Senha definida com sucesso!</h1>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                  Suas credenciais foram configuradas. Você já pode acessar a plataforma.
                </p>
              </div>
              <Link
                href="/login"
                className="w-full flex items-center justify-center py-3 px-4
                  bg-wine-800 hover:bg-wine-900 text-white text-sm font-semibold rounded-lg
                  transition-colors duration-150
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-wine-700"
              >
                Ir para o login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isTokenExpired) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-slate-50 px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-8 py-10 flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
                  className="w-7 h-7 text-amber-600">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-900">Link expirado</h1>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                  Este link de configuração expirou ou não é mais válido.
                  Solicite um novo abaixo.
                </p>
              </div>

              {resendStatus === 'success' ? (
                <div className="w-full flex items-start gap-2.5 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  <p className="text-sm text-emerald-700 leading-snug text-left">
                    Novo link enviado! Verifique seu e-mail.
                  </p>
                </div>
              ) : (
                <>
                  {resendStatus === 'error' && (
                    <div className="w-full flex items-start gap-2.5 p-3.5 rounded-lg bg-red-50 border border-red-200">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        className="w-4 h-4 text-red-600 shrink-0 mt-0.5">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <p className="text-sm text-red-700 leading-snug text-left">
                        Não foi possível reenviar o link. Tente novamente.
                      </p>
                    </div>
                  )}
                  <button
                    type="button"
                    disabled={resendStatus === 'loading'}
                    onClick={handleResend}
                    className="w-full flex items-center justify-center gap-2
                      py-3 px-4 bg-wine-800 hover:bg-wine-900 text-white text-sm font-semibold
                      rounded-lg transition-colors duration-150
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-wine-700
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resendStatus === 'loading' ? (
                      <>
                        <Spinner />
                        <span>Enviando...</span>
                      </>
                    ) : (
                      'Solicitar novo link'
                    )}
                  </button>
                </>
              )}

              <Link
                href="/login"
                className="text-sm font-semibold text-wine-700 hover:text-wine-800 transition-colors duration-150"
              >
                Ir para o login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function validate(): boolean {
    const e: typeof errors = {};
    if (password.length < 6) e.password = 'A senha deve ter pelo menos 6 caracteres';
    if (!confirmPassword) e.confirmPassword = 'Confirme sua senha';
    else if (password !== confirmPassword) e.confirmPassword = 'As senhas não coincidem';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setApiError(null);
    if (!validate()) return;
    setIsPending(true);
    try {
      const res = await fetch('/api/v1/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, confirmPassword, token }),
        cache: 'no-store',
      });
      if (res.status === 401) {
        setIsTokenExpired(true);
        return;
      }
      if (!res.ok) {
        const err: ApiErrorResponse = await res
          .json()
          .catch(() => ({ message: 'Erro inesperado.' }));
        setApiError(err?.message ?? 'Não foi possível definir a senha. Tente novamente.');
        return;
      }
      setSuccess(true);
    } finally {
      setIsPending(false);
    }
  }

  async function handleResend() {
    if (!email) return;
    setResendStatus('loading');
    try {
      await api.post('/api/v1/auth/resend-token', { email });
      setResendStatus('success');
    } catch {
      setResendStatus('error');
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

          {/* Header */}
          <div className="px-8 pt-8 pb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-wine-100">
                <span className="text-wine-800 font-bold text-lg leading-none">C</span>
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm leading-tight">Caritas</p>
                <p className="text-slate-500 text-xs leading-tight mt-0.5">Diocese de Caxias do Sul</p>
              </div>
            </div>
            <div className="border-t border-slate-100" />
          </div>

          {/* Form */}
          <div className="px-8 pb-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Definir senha
              </h1>
              <p className="text-slate-500 text-sm mt-1 leading-relaxed">
                Crie uma senha para acessar a plataforma
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <PasswordField
                id="password"
                label="Nova senha"
                value={password}
                show={showPassword}
                disabled={isPending}
                error={errors.password}
                onChange={(v) => { setPassword(v); setErrors((prev) => ({ ...prev, password: undefined })); }}
                onToggleShow={() => setShowPassword((v) => !v)}
              />

              <PasswordField
                id="confirmPassword"
                label="Confirmar senha"
                value={confirmPassword}
                show={showConfirm}
                disabled={isPending}
                error={errors.confirmPassword}
                onChange={(v) => { setConfirmPassword(v); setErrors((prev) => ({ ...prev, confirmPassword: undefined })); }}
                onToggleShow={() => setShowConfirm((v) => !v)}
              />

              {apiError && (
                <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-red-50 border border-red-200">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    className="w-4 h-4 text-red-600 shrink-0 mt-0.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <p className="text-sm text-red-700 leading-snug">{apiError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isPending || !password || !confirmPassword}
                className="w-full flex items-center justify-center gap-2
                  py-3 px-4 mt-2
                  bg-wine-800 hover:bg-wine-900
                  text-white text-sm font-semibold rounded-lg
                  transition-colors duration-150
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-wine-700
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <>
                    <Spinner />
                    <span>Salvando...</span>
                  </>
                ) : (
                  'Definir senha'
                )}
              </button>
            </form>

            <p className="text-center text-xs text-slate-400 mt-6">
              Já tem acesso?{' '}
              <Link href="/login"
                className="text-wine-700 hover:text-wine-800 font-semibold transition-colors duration-150">
                Fazer login
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          &copy; {new Date().getFullYear()} Caritas Diocese de Caxias do Sul
        </p>
      </div>
    </div>
  );
}
