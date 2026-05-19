'use client';

export function Pagination({
  page, totalPages, totalItems, pageSize, onPage,
}: {
  page: number; totalPages: number; totalItems: number; pageSize: number; onPage: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  const start = totalItems === 0 ? 0 : page * pageSize + 1;
  const end = Math.min((page + 1) * pageSize, totalItems);
  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-200 bg-slate-50">
      <p className="text-xs text-slate-500">
        Exibindo <span className="font-medium text-slate-700">{start}–{end}</span>
        {' '}de <span className="font-medium text-slate-700">{totalItems}</span>
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPage(page - 1)} disabled={page === 0} aria-label="Página anterior"
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200
            disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        {Array.from({ length: totalPages }, (_, i) => i).map((p) => (
          <button key={p} onClick={() => onPage(p)}
            className={['min-w-[32px] h-8 px-2 rounded-lg text-xs font-medium transition-colors',
              p === page ? 'bg-wine-800 text-white' : 'text-slate-600 hover:bg-slate-200',
            ].join(' ')}>
            {p + 1}
          </button>
        ))}
        <button onClick={() => onPage(page + 1)} disabled={page >= totalPages - 1} aria-label="Próxima página"
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200
            disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
