'use client';

import { useRef, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { ProfileModal } from '@/components/profile-modal';

function getInitials(email: string | undefined): string {
  if (!email) return '?';
  const local = email.split('@')[0];
  const parts = local.split(/[._-]/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return local.slice(0, 2).toUpperCase();
}

export function AppTopbar() {
  const { user, logout } = useAuth();
  const initials = getInitials(user?.email);

  const [menuOpen, setMenuOpen]       = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  /* Close dropdown on outside click */
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  /* Close dropdown on Escape */
  useEffect(() => {
    if (!menuOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [menuOpen]);

  return (
    <>
      <header className="flex h-12 shrink-0 items-center justify-between px-4 bg-wine-950 border-b border-wine-900">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-wine-800 flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm leading-none">C</span>
          </div>
          <span className="text-sm font-medium text-white/90 tracking-wide">
            Caritas
            <span className="mx-2 text-wine-600">&mdash;</span>
            <span className="text-white/60 font-normal">Plataforma de Gestão</span>
          </span>
        </div>

        {/* Avatar + dropdown */}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            title={user?.email ?? ''}
            aria-label="Menu do usuário"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            className="w-8 h-8 rounded-full bg-wine-800 hover:bg-wine-700
              flex items-center justify-center
              text-xs font-bold text-white tracking-wider
              transition-colors duration-150
              focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            {initials}
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-200
                py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
            >
              {/* User info */}
              <div className="px-3 py-2 mb-1 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-700 truncate">{user?.email}</p>
                <p className="text-xs text-slate-400 mt-0.5">{user?.roles?.[0] ?? ''}</p>
              </div>

              {/* Edit profile */}
              <button
                role="menuitem"
                onClick={() => { setMenuOpen(false); setProfileOpen(true); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700
                  hover:bg-slate-50 transition-colors duration-100 text-left"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className="w-4 h-4 text-slate-400 shrink-0">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Editar perfil
              </button>

              {/* Logout */}
              <button
                role="menuitem"
                onClick={() => { setMenuOpen(false); logout(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600
                  hover:bg-red-50 transition-colors duration-100 text-left"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className="w-4 h-4 shrink-0">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sair
              </button>
            </div>
          )}
        </div>
      </header>

      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  );
}
