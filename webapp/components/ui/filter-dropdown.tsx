'use client';

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterDropdownProps {
  label: string;
  value: string;
  options: FilterOption[];
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (value: string) => void;
  minWidth?: string;
}

export function FilterDropdown({
  label, value, options, isOpen, onToggle, onSelect, minWidth = '160px',
}: FilterDropdownProps) {
  const selectedLabel = value !== '' ? options.find((o) => o.value === value)?.label : undefined;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className={[
          'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-lg',
          'transition-colors duration-150 focus:outline-none',
          value !== ''
            ? 'bg-wine-50 text-wine-800 border-wine-300'
            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50',
        ].join(' ')}
      >
        {selectedLabel ?? label}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className={['w-3 h-3 transition-transform duration-150', isOpen ? 'rotate-180' : ''].join(' ')}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {isOpen && (
        <div
          className="absolute top-full left-0 mt-1.5 z-20 bg-white border border-slate-200
            rounded-xl shadow-lg py-1.5 overflow-hidden"
          style={{ minWidth }}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onSelect(opt.value)}
              className={[
                'flex w-full items-center px-3 py-2 text-xs transition-colors duration-150',
                value === opt.value
                  ? 'text-wine-800 font-semibold bg-wine-50'
                  : 'text-slate-700 hover:bg-slate-50',
              ].join(' ')}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
