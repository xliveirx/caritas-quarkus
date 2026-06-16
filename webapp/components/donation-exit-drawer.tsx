'use client';

import { useEffect } from 'react';
import type { DonationExitResponse } from '@/shared/types/donation-exit-response';
import type { FamilyResponse } from '@/shared/types/family-response';
import type { ProductDetailResponse } from '@/shared/types/product-detail-response';

const unitLabel: Record<string, string> = {
  KG: 'kg', G: 'g', ML: 'mL', L: 'L', UNIDADES: 'unid.',
};

function getResponsible(family: FamilyResponse): string {
  return family.members.find((m) => m.responsible)?.name ?? `Família #${family.id}`;
}

function formatDateTime(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatDate(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function ProductTags({ product }: { product: ProductDetailResponse }) {
  const parts: string[] = [];
  if (product.type === 'CLOTHES') {
    product.attributes.forEach((a) => parts.push(a.label));
  } else if (product.type === 'FOOD') {
    if (product.batch)          parts.push(`Lote ${product.batch}`);
    if (product.expirationDate) parts.push(`Val. ${formatDate(product.expirationDate)}`);
  } else {
    console.error('[ProductTags] tipo de produto desconhecido:', (product as { type: unknown }).type);
  }
  if (parts.length === 0) return null;
  return (
    <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">{parts.join(' · ')}</p>
  );
}

interface Props {
  exit: DonationExitResponse | null;
  onClose: () => void;
}

export function DonationExitDrawer({ exit, onClose }: Props) {
  const isOpen = exit !== null;

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  return (
    <>
      <div
        className={[
          'fixed inset-0 z-40 bg-black/30 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
        ].join(' ')}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={[
          'fixed right-0 top-0 z-50 h-full w-full max-w-md bg-white shadow-2xl',
          'flex flex-col transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900">Detalhes da saída</h2>
            {exit && (
              <p className="text-xs text-slate-500 mt-0.5">#{exit.id} · {formatDateTime(exit.date)}</p>
            )}
          </div>
          <button onClick={onClose} aria-label="Fechar"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors duration-150">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="w-5 h-5"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {exit && (
            <div className="space-y-6">

              {/* Meta */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <InfoRow label="Data" value={formatDateTime(exit.date)} />
                <InfoRow label="Paróquia" value={exit.parish.name} />
                <InfoRow label="Família" value={getResponsible(exit.family)} />
                <InfoRow label="Cesta" value={exit.kit.name} />
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Status</p>
                  {exit.status === 'CONFIRMED' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full
                      text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Confirmada
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full
                      text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      Cancelada
                    </span>
                  )}
                </div>
              </div>

              {exit.observation && (
                <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">Observação</p>
                  <p className="text-sm text-amber-900 leading-relaxed">{exit.observation}</p>
                </div>
              )}

              {/* Batches */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Itens distribuídos</p>
                  <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
                    {exit.batches.length}
                  </span>
                </div>

                {exit.batches.length === 0 ? (
                  <p className="text-sm text-slate-400 italic">Nenhum item registrado.</p>
                ) : (
                  <div className="space-y-2.5">
                    {exit.batches.map((batch) => (
                      <div key={batch.id}
                        className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                        <div className="flex items-start justify-between gap-3 px-4 py-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-800 leading-tight">
                              {batch.product.name}
                            </p>
                            <ProductTags product={batch.product} />
                          </div>
                          <div className="shrink-0 flex flex-col items-end">
                            <span className="text-xl font-bold text-slate-800 leading-none">
                              {batch.quantity}
                            </span>
                            {batch.product.defaultUnit && (
                              <span className="text-xs font-medium text-slate-400 mt-0.5">
                                {unitLabel[batch.product.defaultUnit] ?? batch.product.defaultUnit}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </div>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}

