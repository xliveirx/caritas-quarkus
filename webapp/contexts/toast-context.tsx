'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
  type ReactNode,
} from 'react';

/* ─── Types ──────────────────────────────────────────────────────── */

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextValue {
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

/* ─── Context ────────────────────────────────────────────────────── */

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast deve ser usado dentro de <ToastProvider>');
  return ctx;
}

/* ─── Individual toast item ──────────────────────────────────────── */

const DURATION = 4500;

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // mount → slide in
    const raf = requestAnimationFrame(() => setVisible(true));

    timerRef.current = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(toast.id), 300);
    }, DURATION);

    return () => {
      cancelAnimationFrame(raf);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast.id, onRemove]);

  const icons = {
    success: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        className="w-4 h-4">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    error: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        className="w-4 h-4">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4M12 16h.01" />
      </svg>
    ),
    info: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        className="w-4 h-4">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4M12 8h.01" />
      </svg>
    ),
  };

  const styles = {
    success: { wrapper: 'bg-white border-emerald-200', icon: 'text-emerald-600 bg-emerald-50', title: 'text-slate-900', message: 'text-slate-500' },
    error:   { wrapper: 'bg-white border-red-200',     icon: 'text-red-600 bg-red-50',         title: 'text-slate-900', message: 'text-slate-500' },
    info:    { wrapper: 'bg-white border-blue-200',    icon: 'text-blue-600 bg-blue-50',        title: 'text-slate-900', message: 'text-slate-500' },
  };

  const s = styles[toast.type];

  return (
    <div
      role="alert"
      aria-live="polite"
      className={[
        'flex items-start gap-3 w-80 p-4 rounded-xl border shadow-lg',
        'transition-all duration-300 ease-out',
        s.wrapper,
        visible ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0',
      ].join(' ')}
    >
      <span className={`flex items-center justify-center w-7 h-7 rounded-lg shrink-0 ${s.icon}`}>
        {icons[toast.type]}
      </span>
      <div className="flex-1 min-w-0 pt-0.5">
        <p className={`text-sm font-semibold leading-tight ${s.title}`}>{toast.title}</p>
        {toast.message && (
          <p className={`text-xs mt-1 leading-relaxed ${s.message}`}>{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => { setVisible(false); setTimeout(() => onRemove(toast.id), 300); }}
        aria-label="Fechar notificação"
        className="text-slate-400 hover:text-slate-600 transition-colors shrink-0 mt-0.5"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className="w-3.5 h-3.5">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

/* ─── Provider + Container ───────────────────────────────────────── */

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const add = useCallback((type: ToastType, title: string, message?: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
  }, []);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = useMemo<ToastContextValue>(() => ({
    success: (title, message) => add('success', title, message),
    error:   (title, message) => add('error',   title, message),
    info:    (title, message) => add('info',     title, message),
  }), [add]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast container — fixed bottom-right */}
      <div className="fixed bottom-5 right-5 z-[1000] flex flex-col gap-2 items-end pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onRemove={remove} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
