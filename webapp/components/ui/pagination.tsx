'use client';

function pageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 1) return [0];
  if (total <= 7) return Array.from({ length: total }, (_, i) => i);

  const pages: (number | '...')[] = [0];

  const start = Math.max(1, current - 1);
  const end   = Math.min(total - 2, current + 1);

  if (start > 1) pages.push('...');
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 2) pages.push('...');

  pages.push(total - 1);
  return pages;
}

interface Props {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPage: (p: number) => void;
}

export function Pagination({ page, totalPages, totalItems, pageSize, onPage }: Props) {
  const start = totalItems === 0 ? 0 : page * pageSize + 1;
  const end   = Math.min((page + 1) * pageSize, totalItems);
  const pages = pageNumbers(page, totalPages);

  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-200 bg-slate-50">
      {/* Info */}
      <p className="text-xs text-slate-500 hidden sm:block">
        <span className="font-medium text-slate-700">{start}–{end}</span>
        {' '}de{' '}
        <span className="font-medium text-slate-700">{totalItems}</span>
      </p>

      {/* Controls */}
      <div className="flex items-center gap-0.5">
        {/* Prev */}
        <PageBtn onClick={() => onPage(page - 1)} disabled={page === 0} aria-label="Página anterior">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </PageBtn>

        {pages.map((p, i) =>
          p === '...'
            ? <span key={`e${i}`} className="min-w-[32px] h-8 flex items-center justify-center text-xs text-slate-400 select-none">…</span>
            : <PageBtn
                key={p}
                onClick={() => onPage(p)}
                active={p === page}
              >
                {p + 1}
              </PageBtn>
        )}

        {/* Next */}
        <PageBtn onClick={() => onPage(page + 1)} disabled={page >= totalPages - 1} aria-label="Próxima página">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </PageBtn>
      </div>

      {/* Page X of Y (mobile + desktop right side) */}
      <p className="text-xs text-slate-500">
        Pág. <span className="font-medium text-slate-700">{page + 1}</span>
        {' '}de{' '}
        <span className="font-medium text-slate-700">{totalPages}</span>
      </p>
    </div>
  );
}

function PageBtn({
  children, onClick, disabled, active, 'aria-label': ariaLabel,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  'aria-label'?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={[
        'min-w-[32px] h-8 px-1.5 rounded-lg text-xs font-medium transition-colors duration-100',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        active
          ? 'bg-wine-800 text-white'
          : 'text-slate-600 hover:bg-slate-200',
      ].join(' ')}
    >
      {children}
    </button>
  );
}
