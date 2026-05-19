'use client';

import { useState, type FormEvent } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
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

function InfoIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className="w-4 h-4 shrink-0 mt-0.5">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  );
}

export function LoginForm() {
  const { login } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    try {
      await login({ email, password });
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      toast.error(
        apiErr?.title ?? 'Falha ao entrar',
        apiErr?.message ?? 'Verifique seu e-mail e senha e tente novamente.'
      );
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
                Bem-vindo de volta
              </h1>
              <p className="text-slate-500 text-sm mt-1 leading-relaxed">
                Entre com as credenciais da sua paróquia
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Email */}
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
                  placeholder="voluntario@caritas.org.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isPending}
                  className="w-full px-3.5 py-3 text-sm text-slate-900 placeholder-slate-400
                    border border-slate-300 rounded-lg bg-white
                    transition-colors duration-150
                    focus:outline-none focus:ring-2 focus:ring-wine-700 focus:border-wine-700
                    disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password"
                    className="block text-xs font-semibold tracking-widest text-slate-600 uppercase">
                    Senha
                  </label>
                  <button type="button"
                    className="text-xs text-wine-700 hover:text-wine-800 font-medium
                      transition-colors duration-150 focus:outline-none focus-visible:underline">
                    Esqueci minha senha
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isPending}
                    className="w-full px-3.5 py-3 pr-11 text-sm text-slate-900 placeholder-slate-400
                      border border-slate-300 rounded-lg bg-white
                      transition-colors duration-150
                      focus:outline-none focus:ring-2 focus:ring-wine-700 focus:border-wine-700
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    onClick={() => setShowPassword((v) => !v)}
                    disabled={isPending}
                    className="absolute right-3 top-1/2 -translate-y-1/2
                      text-slate-400 hover:text-slate-600 transition-colors duration-150
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-wine-700 rounded
                      disabled:cursor-not-allowed"
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>


              {/* Submit */}
              <button
                type="submit"
                disabled={isPending || !email || !password}
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
                    <span>Entrando...</span>
                  </>
                ) : (
                  'Entrar na plataforma'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400 font-medium">ou</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Info box */}
            <div className="flex items-start gap-2.5 p-4 rounded-xl bg-wine-50 border border-wine-100">
              <span className="text-wine-700"><InfoIcon /></span>
              <div>
                <p className="text-sm font-semibold text-wine-800 mb-0.5">Acesso por paróquia</p>
                <p className="text-xs text-wine-700 leading-relaxed">
                  Cada voluntário acessa apenas os dados da sua paróquia.
                  A Diocese possui visão global consolidada.
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          &copy; {new Date().getFullYear()} Caritas Diocese de Caxias do Sul
        </p>
      </div>
    </div>
  );
}
