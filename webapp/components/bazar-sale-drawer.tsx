'use client';

import { useEffect } from 'react';
import type { BazarSaleResponse } from '@/shared/types/bazar-sale-response';
import { generateBazarReceipt } from '@/lib/generate-bazar-receipt';

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function formatDateTime(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatCpf(cpf: string): string {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length === 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  return cpf;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}

interface Props {
  sale: BazarSaleResponse | null;
  onClose: () => void;
}

export function BazarSaleDrawer({ sale, onClose }: Props) {
  const isOpen = sale !== null;

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
            <h2 className="text-base font-bold text-slate-900">Detalhes da venda</h2>
            {sale && (
              <p className="text-xs text-slate-500 mt-0.5">#{sale.id} · {formatDateTime(sale.soldAt)}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {sale && (
              <button
                onClick={() => generateBazarReceipt(sale)}
                aria-label="Baixar recibo PDF"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold
                  text-wine-700 border border-wine-200 hover:bg-wine-50
                  rounded-lg transition-colors duration-150"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className="w-3.5 h-3.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Recibo PDF
              </button>
            )}
            <button onClick={onClose} aria-label="Fechar"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors duration-150">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className="w-5 h-5"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {sale && (
            <div className="space-y-6">

              {/* Meta */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <InfoRow label="Data" value={formatDateTime(sale.soldAt)} />
                <InfoRow label="Paróquia" value={sale.parish.name} />
                <InfoRow label="Comprador" value={sale.buyerName} />
                <InfoRow label="CPF" value={formatCpf(sale.buyerCpf)} />
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Itens vendidos</p>
                  <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
                    {sale.items.length}
                  </span>
                </div>

                {sale.items.length === 0 ? (
                  <p className="text-sm text-slate-400 italic">Nenhum item registrado.</p>
                ) : (
                  <div className="space-y-2.5">
                    {sale.items.map((item) => (
                      <div key={item.id}
                        className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                        <div className="flex items-start justify-between gap-3 px-4 py-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-800 leading-tight">
                              {item.productName}
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                              {item.productType === 'CLOTHES' ? 'Roupa' : item.productType === 'FOOD' ? 'Alimento' : '—'}
                              {' · '}Preço unit.: {BRL.format(item.unitPrice)}
                            </p>
                          </div>
                          <div className="shrink-0 flex flex-col items-end">
                            <span className="text-xl font-bold text-slate-800 leading-none">
                              {item.quantity}
                            </span>
                            <span className="text-xs font-medium text-slate-400 mt-0.5">un.</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-end px-4 py-2 bg-slate-50 border-t border-slate-100">
                          <span className="text-xs text-slate-500 mr-1.5">Subtotal</span>
                          <span className="text-sm font-bold text-slate-800">{BRL.format(item.subtotal)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="flex items-center justify-between rounded-xl bg-wine-50 border border-wine-100 px-4 py-3">
                <p className="text-sm font-semibold text-wine-800">Total da venda</p>
                <p className="text-lg font-bold text-wine-900">{BRL.format(sale.total)}</p>
              </div>

            </div>
          )}
        </div>
      </div>
    </>
  );
}
