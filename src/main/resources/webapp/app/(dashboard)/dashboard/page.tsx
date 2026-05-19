import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | Caritas',
};

export default function DashboardPage() {
  return (
    <div className="flex flex-1 items-center justify-center min-h-full p-8">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-wine-800/10 flex items-center justify-center mx-auto mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-8 h-8 text-wine-800"
          >
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-slate-800 mb-1">Dashboard</h1>
        <p className="text-sm text-slate-500">Em construção — os dados serão exibidos aqui em breve.</p>
      </div>
    </div>
  );
}
