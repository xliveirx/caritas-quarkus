'use client';

import { useEffect } from 'react';
import { formatCPF, formatCurrency } from '@/shared/utils/formatters';
import { SITUATION_LABELS, type Situation } from '@/shared/types/situation';
import type { FamilyResponse } from '@/shared/types/family-response';

const SITUATION_COLORS: Record<Situation, string> = {
  RISCO_BAIXO:       'bg-emerald-50 text-emerald-700 border-emerald-100',
  RISCO_MEDIO:       'bg-amber-50 text-amber-700 border-amber-100',
  RISCO_ALTO:        'bg-orange-50 text-orange-700 border-orange-100',
  POBREZA_EXTREMA:   'bg-red-50 text-red-700 border-red-100',
  EMERGENCIA_SOCIAL: 'bg-purple-50 text-purple-700 border-purple-100',
};

function parseDateParts(dateStr: string): [number, number, number] {
  const [y, m, d] = dateStr.split('-').map(Number);
  return [y, m, d];
}

function formatBirthDate(dateStr: string): string {
  const [y, m, d] = parseDateParts(dateStr);
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}

function calcAge(dateStr: string): number {
  const [year, month, day] = parseDateParts(dateStr);
  const today = new Date();
  let age = today.getFullYear() - year;
  const dm = today.getMonth() + 1 - month;
  if (dm < 0 || (dm === 0 && today.getDate() < day)) age--;
  return age;
}

interface Props {
  open: boolean;
  family: FamilyResponse | null;
  onClose: () => void;
}

export function FamilyDetailsModal({ open, family, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open || !family) return null;

  const responsible = family.members.find((m) => m.responsible);
  const others = family.members.filter((m) => !m.responsible);
  const sortedMembers = responsible ? [responsible, ...others] : others;

  const address = family.address;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-wine-50 border border-wine-100
              flex items-center justify-center shrink-0">
              <span className="text-wine-700 font-bold text-sm">
                {responsible?.name.charAt(0).toUpperCase() ?? '?'}
              </span>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {responsible?.name ?? `Família #${family.id}`}
              </h2>
              <span className={[
                'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border',
                SITUATION_COLORS[family.situation],
              ].join(' ')}>
                {SITUATION_LABELS[family.situation]}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100
              transition-colors duration-150"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="w-5 h-5">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6 rounded-b-2xl">

          {/* Members */}
          <section>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Membros · {family.members.length}
            </p>
            <div className="space-y-2">
              {sortedMembers.map((member) => (
                <div key={member.id}
                  className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-8 h-8 rounded-full bg-white border border-slate-200
                    flex items-center justify-center shrink-0">
                    <span className="text-slate-600 font-bold text-xs">
                      {member.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-800">{member.name}</span>
                      {member.responsible && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md
                          text-[10px] font-bold uppercase tracking-wide
                          bg-wine-50 text-wine-700 border border-wine-100">
                          Responsável
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                      {member.cpf && (
                        <span className="text-xs text-slate-500">
                          CPF: <span className="font-medium text-slate-700">{formatCPF(member.cpf)}</span>
                        </span>
                      )}
                      {member.birthDate && (
                        <span className="text-xs text-slate-500">
                          Nasc.: <span className="font-medium text-slate-700">
                            {formatBirthDate(member.birthDate)}
                          </span>
                          {' '}
                          <span className="text-slate-400">({calcAge(member.birthDate)} anos)</span>
                        </span>
                      )}
                    </div>
                    {member.motherName && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        Mãe: <span className="text-slate-600">{member.motherName}</span>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Economic data */}
          <section>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Dados econômicos
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">
                  Renda mensal
                </p>
                <p className="text-sm font-bold text-slate-800">
                  {formatCurrency(family.monthlyIncome)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">
                  Bolsa Família
                </p>
                <span className={[
                  'inline-flex items-center gap-1 text-sm font-semibold',
                  family.bolsaFamilia ? 'text-emerald-600' : 'text-slate-500',
                ].join(' ')}>
                  {family.bolsaFamilia ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                        className="w-3.5 h-3.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Sim
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                        className="w-3.5 h-3.5">
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                      Não
                    </>
                  )}
                </span>
              </div>
            </div>
          </section>

          {/* Address */}
          {address && (
            <section>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Endereço
              </p>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
                <p className="text-sm font-medium text-slate-800">
                  {address.street}, {address.number}
                  {address.complement && ` — ${address.complement}`}
                </p>
                <p className="text-xs text-slate-500">
                  {address.city} · {address.state} · CEP {address.postalCode}
                </p>
              </div>
            </section>
          )}

          {/* Observation */}
          {family.observation && (
            <section>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Observação
              </p>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-sm text-slate-700 leading-relaxed">{family.observation}</p>
              </div>
            </section>
          )}
        </div>

      </div>
    </div>
  );
}
