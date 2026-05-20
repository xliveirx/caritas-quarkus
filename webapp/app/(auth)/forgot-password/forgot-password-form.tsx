'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import type { ApiErrorResponse } from '@/shared/types/api-error-response';

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [emailError, setEmailError] = useState<string | undefined>();
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-900">Verifique seu e-mail</h1>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                  Se este e-mail estiver cadastrado, você receberá em breve um link para redefinir sua senha.
                </p>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Não recebeu? Verifique a caixa de spam ou entre em contato com o administrador.
              </p>
              <Link
                href="/login"
                className="text-sm font-semibold text-wine-700 hover:text-wine-800 transition-colors duration-150"
              >
                Voltar ao login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function validate(): boolean {
    if (!email.trim()) {
      setEmailError('E-mail obrigatório');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('E-mail inválido');
      return false;
    }
    setEmailError(undefined);
    return true;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setApiError(null);
    if (!validate()) return;
    setIsPending(true);
    try {
      const res = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
        cache: 'no-store',
      });
      if (!res.ok) {
        const err: ApiErrorResponse = await res
          .json()
          .catch(() => ({ message: 'Erro inesperado.' }));
        setApiError(err?.message ?? 'Não foi possível processar a solicitação. Tente novamente.');
        return;
      }
      setSuccess(true);
    } finally {
      setIsPending(false);
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
                Esqueci minha senha
              </h1>
              <p className="text-slate-500 text-sm mt-1 leading-relaxed">
                Informe seu e-mail e enviaremos um link para redefinir sua senha
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="email"
                  className="block text-xs font-semibold tracking-widest text-slate-600 uppercase">
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError(undefined);
                    setApiError(null);
                  }}
                  disabled={isPending}
                  className={[
                    'w-full px-3.5 py-3 text-sm text-slate-900 placeholder-slate-400',
                    'border rounded-lg bg-white transition-colors duration-150',
                    'focus:outline-none focus:ring-2 focus:ring-wine-700 focus:border-wine-700',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    emailError
                      ? 'border-red-400 focus:ring-red-500 focus:border-red-500'
                      : 'border-slate-300',
                  ].join(' ')}
                />
                {emailError && (
                  <p className="text-xs text-red-600 font-medium">{emailError}</p>
                )}
              </div>

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
                disabled={isPending || !email}
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
                    <span>Enviando...</span>
                  </>
                ) : (
                  'Enviar link de redefinição'
                )}
              </button>
            </form>

            <p className="text-center text-xs text-slate-400 mt-6">
              Lembrou a senha?{' '}
              <Link href="/login"
                className="text-wine-700 hover:text-wine-800 font-semibold transition-colors duration-150">
                Voltar ao login
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
