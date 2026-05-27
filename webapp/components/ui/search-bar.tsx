'use client';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, onSubmit, placeholder = 'Buscar...' }: SearchBarProps) {
  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onSubmit(); }}
          className="w-full pl-9 pr-9 py-2.5 text-sm bg-white border border-slate-200 rounded-xl
            shadow-sm placeholder-slate-400 text-slate-900
            focus:outline-none focus:ring-2 focus:ring-wine-700/30 focus:border-wine-700
            transition-colors duration-150"
        />
        {value && (
          <button
            type="button"
            aria-label="Limpar busca"
            onClick={() => onChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400
              hover:text-slate-600 transition-colors duration-150"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              className="w-3.5 h-3.5">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={onSubmit}
        className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white
          bg-wine-800 hover:bg-wine-900 rounded-xl transition-colors duration-150
          focus:outline-none focus-visible:ring-2 focus-visible:ring-wine-700 shrink-0"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className="w-4 h-4">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
        </svg>
        Buscar
      </button>
    </div>
  );
}
