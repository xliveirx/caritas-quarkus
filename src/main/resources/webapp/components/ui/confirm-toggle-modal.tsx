'use client';

import { useEffect, useRef } from 'react';

export function ConfirmToggleModal({
  name, active, entityLabel, isPending, onConfirm, onCancel,
}: {
  name: string;
  active: boolean;
  entityLabel: string;
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const isDeactivating = active;

  useEffect(() => {
    cancelRef.current?.focus();
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && !isPending) onCancel(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isPending, onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => { if (!isPending) onCancel(); }}
        aria-hidden="true"
      />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-start gap-4">
          <div className={[
            'flex items-center justify-center w-10 h-10 rounded-full shrink-0',
            isDeactivating ? 'bg-amber-100' : 'bg-emerald-100',
          ].join(' ')}>
            {isDeactivating ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className="w-5 h-5 text-amber-600">
                <circle cx="12" cy="12" r="10" />
                <line x1="10" y1="15" x2="10" y2="9" />
                <line x1="14" y1="15" x2="14" y2="9" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className="w-5 h-5 text-emerald-600">
                <circle cx="12" cy="12" r="10" />
                <polygon points="10 8 16 12 10 16 10 8" />
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-slate-900">
              {isDeactivating ? 'Inativar' : 'Ativar'} {entityLabel}
            </h3>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">
              Tem certeza que deseja {isDeactivating ? 'inativar' : 'ativar'}{' '}
              <span className="font-semibold text-slate-700">&ldquo;{name}&rdquo;</span>?
              {isDeactivating
                ? ' O usuário perderá o acesso ao sistema.'
                : ' O usuário terá acesso ao sistema novamente.'}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800
              rounded-lg hover:bg-slate-100 transition-colors duration-150
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className={[
              'flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg',
              'transition-colors duration-150 focus:outline-none',
              'focus-visible:ring-2 disabled:opacity-50 disabled:cursor-not-allowed',
              isDeactivating
                ? 'bg-amber-500 hover:bg-amber-600 focus-visible:ring-amber-400'
                : 'bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-500',
            ].join(' ')}
          >
            {isPending ? (
              <>
                <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {isDeactivating ? 'Inativando...' : 'Ativando...'}
              </>
            ) : (isDeactivating ? 'Inativar' : 'Ativar')}
          </button>
        </div>
      </div>
    </div>
  );
}
