'use client';

import { useEffect, useRef } from 'react';

export function ConfirmDeleteModal({
  title, description, isPending, onConfirm, onCancel,
  confirmLabel = 'Excluir',
  confirmClassName = 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-500',
  icon,
  iconBg = 'bg-red-100',
}: {
  title: string;
  description: React.ReactNode;
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  confirmClassName?: string;
  icon?: React.ReactNode;
  iconBg?: string;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);

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
          <div className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 ${iconBg}`}>
            {icon ?? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className="w-5 h-5 text-red-600">
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                <path d="M10 11v6M14 11v6" />
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">{description}</p>
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
              'transition-colors duration-150 focus:outline-none focus-visible:ring-2',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              confirmClassName,
            ].join(' ')}
          >
            {isPending ? (
              <>
                <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Aguarde...
              </>
            ) : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
