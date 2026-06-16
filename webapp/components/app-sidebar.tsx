'use client';

import { useState, useEffect, type JSX } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import type { UserRole } from '@/shared/types/user-role';

/* ─── SVG Icons ──────────────────────────────────────────────────── */

function DashboardIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
      className="w-[18px] h-[18px] shrink-0">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function FamiliesIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
      className="w-[18px] h-[18px] shrink-0">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function EntradaIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
      className="w-[18px] h-[18px] shrink-0">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function SaidaIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
      className="w-[18px] h-[18px] shrink-0">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function StockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
      className="w-[18px] h-[18px] shrink-0">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function AgendaIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
      className="w-[18px] h-[18px] shrink-0">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="8" y1="14" x2="8" y2="14" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="12" y1="14" x2="12" y2="14" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="16" y1="14" x2="16" y2="14" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="8" y1="18" x2="8" y2="18" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="12" y1="18" x2="12" y2="18" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function VisitsIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
      className="w-[18px] h-[18px] shrink-0">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <polyline points="9 16 11 18 15 14" />
    </svg>
  );
}

function CestasIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
      className="w-[18px] h-[18px] shrink-0">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 01-8 0"/>
    </svg>
  );
}

function BazarIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
      className="w-[18px] h-[18px] shrink-0">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function VolunteersIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
      className="w-[18px] h-[18px] shrink-0">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function CaixaIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
      className="w-[18px] h-[18px] shrink-0">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      <line x1="12" y1="12" x2="12" y2="16" />
      <line x1="10" y1="14" x2="14" y2="14" />
    </svg>
  );
}

function ParishIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
      className="w-[18px] h-[18px] shrink-0">
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="10" y1="4" x2="14" y2="4" />
      <path d="M5 10L12 6l7 4v10a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V10z" />
      <rect x="9" y="14" width="6" height="8" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
      className="w-[18px] h-[18px] shrink-0">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

/* ─── Nav definition ─────────────────────────────────────────────── */

interface NavItem {
  href: string;
  label: string;
  icon: () => JSX.Element;
  roles: UserRole[];
}

interface SubItem {
  href: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: DashboardIcon,
    roles: ['ADMIN', 'COORDINATOR', 'VOLUNTEER'],
  },
  {
    href: '/familias',
    label: 'Famílias',
    icon: FamiliesIcon,
    roles: ['ADMIN', 'COORDINATOR', 'VOLUNTEER'],
  },
  {
    href: '/entrada',
    label: 'Entrada',
    icon: EntradaIcon,
    roles: ['ADMIN', 'COORDINATOR', 'VOLUNTEER'],
  },
  {
    href: '/saida',
    label: 'Saída',
    icon: SaidaIcon,
    roles: ['ADMIN', 'COORDINATOR', 'VOLUNTEER'],
  },
  {
    href: '/estoque',
    label: 'Estoque',
    icon: StockIcon,
    roles: ['ADMIN', 'COORDINATOR', 'VOLUNTEER'],
  },
  {
    href: '/cestas',
    label: 'Cestas Básicas',
    icon: CestasIcon,
    roles: ['ADMIN', 'COORDINATOR', 'VOLUNTEER'],
  },
  {
    href: '/visitas',
    label: 'Visitas',
    icon: VisitsIcon,
    roles: ['ADMIN', 'COORDINATOR', 'VOLUNTEER'],
  },
  {
    href: '/agenda',
    label: 'Agenda',
    icon: AgendaIcon,
    roles: ['ADMIN', 'COORDINATOR', 'VOLUNTEER'],
  },
  {
    href: '/voluntarios',
    label: 'Voluntários',
    icon: VolunteersIcon,
    roles: ['COORDINATOR'],
  },
  {
    href: '/caixa',
    label: 'Caixa',
    icon: CaixaIcon,
    roles: ['ADMIN', 'COORDINATOR'],
  },
  {
    href: '/paroquias',
    label: 'Paróquias',
    icon: ParishIcon,
    roles: ['ADMIN'],
  },
];

const SETTINGS_SUB_ITEMS: SubItem[] = [
  { href: '/configuracoes/atributos', label: 'Atributos' },
];

const SETTINGS_ROLES: UserRole[] = ['ADMIN', 'COORDINATOR'];

/* ─── Component ──────────────────────────────────────────────────── */

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const onSettingsPath = pathname.startsWith('/configuracoes');
  const [settingsExpanded, setSettingsExpanded] = useState(onSettingsPath);

  useEffect(() => {
    if (onSettingsPath) setSettingsExpanded(true);
  }, [onSettingsPath]);

  const userRoles = user?.roles ?? [];
  const visibleItems = NAV_ITEMS.filter((item) => item.roles.some((r) => userRoles.includes(r)));
  const showSettings = SETTINGS_ROLES.some((r) => userRoles.includes(r));

  return (
    <aside className="flex flex-col w-[196px] shrink-0 bg-wine-950 select-none overflow-y-auto">
      <nav className="flex flex-col flex-1 px-3 py-4 gap-0.5">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium',
                'transition-colors duration-150',
                isActive
                  ? 'bg-wine-800/60 text-white'
                  : 'text-wine-200/70 hover:bg-wine-900 hover:text-white',
              ].join(' ')}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-amber-400" />
              )}
              <Icon />
              <span className="leading-none">{item.label}</span>
            </Link>
          );
        })}

        {/* Configurações */}
        {showSettings && (
          <div className="space-y-0.5">
            <button
              onClick={() => setSettingsExpanded((v) => !v)}
              className={[
                'w-full relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium',
                'transition-colors duration-150',
                onSettingsPath
                  ? 'bg-wine-800/60 text-white'
                  : 'text-wine-200/70 hover:bg-wine-900 hover:text-white',
              ].join(' ')}
            >
              {onSettingsPath && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-amber-400" />
              )}
              <SettingsIcon />
              <span className="leading-none flex-1 text-left">Configurações</span>
              <ChevronIcon open={settingsExpanded} />
            </button>

            {settingsExpanded && (
              <div className="pl-6 space-y-0.5">
                {SETTINGS_SUB_ITEMS.map((sub) => {
                  const isActive = pathname === sub.href || pathname.startsWith(sub.href + '/');
                  return (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      className={[
                        'relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium',
                        'transition-colors duration-150',
                        isActive
                          ? 'bg-wine-800/60 text-white'
                          : 'text-wine-200/60 hover:bg-wine-900 hover:text-white',
                      ].join(' ')}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-amber-400" />
                      )}
                      <span className="leading-none">{sub.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </nav>
    </aside>
  );
}
