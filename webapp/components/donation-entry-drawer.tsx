'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/services/api';
import type { DonationEntryResponse } from '@/shared/types/donation-entry-response';
import type { ClothesDetailResponse } from '@/shared/types/clothes-detail-response';
import type { FoodDetailResponse } from '@/shared/types/food-detail-response';

type ProductDetail = ClothesDetailResponse | FoodDetailResponse;

const categoryLabel: Record<string, string> = {
  CALCA: 'Calça', CAMISETA: 'Camiseta', MOLETOM: 'Moletom', CASACO: 'Casaco',
  TENIS: 'Tênis', SAPATO: 'Sapato', BOTA: 'Bota', ACESSORIO: 'Acessório', JAQUETA: 'Jaqueta',
};

const genderLabel: Record<string, string> = {
  MASCULINO: 'Masc.', FEMININO: 'Fem.', UNISSEX: 'Unissex',
};

const unitLabel: Record<string, string> = {
  KG: 'kg', G: 'g', ML: 'mL', L: 'L', UNIDADES: 'unid.',
};

function isClothes(d: ProductDetail): d is ClothesDetailResponse {
  return 'condition' in d;
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

interface Props {
  entryId: number | null;
  onClose: () => void;
}

export function DonationEntryDrawer({ entryId, onClose }: Props) {
  const { token } = useAuth();
  const [entry, setEntry] = useState<DonationEntryResponse | null>(null);
  const [productDetails, setProductDetails] = useState<Record<number, ProductDetail>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!entryId || !token) { setEntry(null); setProductDetails({}); return; }
    setIsLoading(true);
    setError(null);

    api.get<DonationEntryResponse>(`/api/v1/donations/entries/${entryId}`, token)
      .then(async (data) => {
        setEntry(data);

        const fetchDetail = (id: number, path: string) =>
          api.get<ProductDetail>(path, token!).then((detail) => ({ id, detail })).catch(() => null);

        const detailFetches = data.batches.map(async (batch) => {
          const { id, type } = batch.product;
          if (type === 'CLOTHES') return fetchDetail(id, `/api/v1/products/clothes/${id}`);
          if (type === 'FOOD')    return fetchDetail(id, `/api/v1/products/foods/${id}`);
          const fromClothes = await fetchDetail(id, `/api/v1/products/clothes/${id}`);
          if (fromClothes) return fromClothes;
          return fetchDetail(id, `/api/v1/products/foods/${id}`);
        });

        const results = await Promise.all(detailFetches);
        const map: Record<number, ProductDetail> = {};
        results.forEach((r) => { if (r) map[r.id] = r.detail; });
        setProductDetails(map);
      })
      .catch(() => setError('Não foi possível carregar os detalhes.'))
      .finally(() => setIsLoading(false));
  }, [entryId, token]);

  const isOpen = entryId !== null;

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
            <h2 className="text-base font-bold text-slate-900">Detalhes da entrada</h2>
            {entry && (
              <p className="text-xs text-slate-500 mt-0.5">#{entry.id} · {formatDateTime(entry.date)}</p>
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
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/2" />
              <div className="h-4 bg-slate-200 rounded w-3/4" />
              <div className="h-4 bg-slate-200 rounded w-2/3" />
              <div className="mt-6 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 bg-slate-100 rounded-xl" />
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 text-slate-300">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-sm text-slate-500">{error}</p>
            </div>
          ) : entry ? (
            <div className="space-y-6">

              {/* Meta */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <InfoRow label="Data" value={formatDateTime(entry.date)} />
                <InfoRow label="Paróquia" value={entry.parish.name} />
                <InfoRow label="Doador" value={entry.donator || '—'} />
              </div>

              {entry.observation && (
                <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">Observação</p>
                  <p className="text-sm text-amber-900 leading-relaxed">{entry.observation}</p>
                </div>
              )}

              {/* Batches */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Itens recebidos</p>
                  <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
                    {entry.batches.length}
                  </span>
                </div>

                {entry.batches.length === 0 ? (
                  <p className="text-sm text-slate-400 italic">Nenhum item registrado.</p>
                ) : (
                  <div className="space-y-2.5">
                    {entry.batches.map((batch) => {
                      const detail = productDetails[batch.product.id];
                      const isClothesDetail = detail && isClothes(detail);

                      return (
                        <div key={batch.id}
                          className="rounded-xl border border-slate-200 bg-white overflow-hidden">

                          {/* Product row */}
                          <div className="flex items-start justify-between gap-3 px-4 py-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-slate-800 leading-tight">
                                {batch.product.name}
                              </p>

                              {/* Detail tags */}
                              {detail && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {isClothesDetail ? (
                                    <>
                                      {detail.size && (
                                        <DetailTag color="slate">{detail.size}</DetailTag>
                                      )}
                                      {detail.category && (
                                        <DetailTag color="slate">{categoryLabel[detail.category]}</DetailTag>
                                      )}
                                      {detail.gender && (
                                        <DetailTag color="slate">{genderLabel[detail.gender]}</DetailTag>
                                      )}
                                      <DetailTag color={detail.condition === 'NOVO' ? 'green' : 'amber'}>
                                        {detail.condition === 'NOVO' ? 'Novo' : 'Usado'}
                                      </DetailTag>
                                    </>
                                  ) : (
                                    <>
                                      {!isClothes(detail) && detail.expirationDate && (
                                        <DetailTag color="blue">
                                          Val. {formatDate(detail.expirationDate)}
                                        </DetailTag>
                                      )}
                                      {!isClothes(detail) && detail.batch && (
                                        <DetailTag color="slate">
                                          Lote {detail.batch}
                                        </DetailTag>
                                      )}
                                    </>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Quantity + unit */}
                            <div className="shrink-0 flex flex-col items-end">
                              <span className="text-xl font-bold text-slate-800 leading-none">
                                {batch.quantity}
                              </span>
                              {batch.unit && (
                                <span className="text-xs font-medium text-slate-400 mt-0.5">
                                  {unitLabel[batch.unit] ?? batch.unit}
                                </span>
                              )}
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : null}
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

function DetailTag({ children, color }: { children: React.ReactNode; color: 'slate' | 'green' | 'amber' | 'blue' }) {
  const colors = {
    slate: 'bg-slate-100 text-slate-600 border-slate-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    blue:  'bg-blue-50 text-blue-700 border-blue-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${colors[color]}`}>
      {children}
    </span>
  );
}
