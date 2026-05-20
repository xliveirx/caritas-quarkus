'use client';

export function ErrorState({
  title, message, onRetry,
}: {
  title: string; message?: string; onRetry: () => void;
}) {
  return (
    <div className="p-6 max-w-7xl mx-auto flex items-center justify-center min-h-[60dvh]">
      <div className="flex flex-col items-center gap-4 text-center max-w-sm">
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
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          {message && <p className="text-sm text-slate-500 mt-1 leading-relaxed">{message}</p>}
        </div>
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white
            bg-wine-800 hover:bg-wine-900 rounded-lg transition-colors duration-150
            focus:outline-none focus-visible:ring-2 focus-visible:ring-wine-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className="w-4 h-4">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M3 21v-5h5" />
          </svg>
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
