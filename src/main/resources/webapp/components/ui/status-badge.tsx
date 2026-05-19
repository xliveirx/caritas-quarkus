'use client';

export function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={[
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold',
      active
        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
        : 'bg-slate-100 text-slate-500 border border-slate-200',
    ].join(' ')}>
      <span className={['w-1.5 h-1.5 rounded-full', active ? 'bg-emerald-500' : 'bg-slate-400'].join(' ')} />
      {active ? 'Ativo' : 'Inativo'}
    </span>
  );
}
