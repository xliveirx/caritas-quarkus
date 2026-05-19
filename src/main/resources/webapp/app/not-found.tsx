'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-slate-50 px-4">
      <div className="text-center max-w-sm">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-wine-100 mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            className="w-8 h-8 text-wine-700">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
            <path d="M11 8v3M11 14h.01" />
          </svg>
        </div>

        <p className="text-xs font-semibold tracking-widest text-wine-700 uppercase mb-2">
          Erro 404
        </p>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Página não encontrada
        </h1>
        <p className="text-sm text-slate-500 leading-relaxed mb-8">
          A página que você está procurando não existe ou foi movida.
        </p>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold
            text-white bg-wine-800 hover:bg-wine-900 rounded-lg
            transition-colors duration-150
            focus:outline-none focus-visible:ring-2 focus-visible:ring-wine-700"
        >
          Ir ao início
        </Link>
      </div>
    </div>
  );
}
