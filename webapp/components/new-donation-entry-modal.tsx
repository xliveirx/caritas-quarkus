'use client';

import { useState, useEffect, useRef, type FormEvent } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import { api } from '@/services/api';
import { Field, inputClass } from '@/components/ui/field';
import { NewProductModal } from '@/components/new-product-modal';
import type { DonationEntryResponse } from '@/shared/types/donation-entry-response';
import type { ProductResponse } from '@/shared/types/product-response';
import type { ClothesDetailResponse } from '@/shared/types/clothes-detail-response';
import type { FoodDetailResponse } from '@/shared/types/food-detail-response';
import type { ParishResponse } from '@/shared/types/parish-response';
import type { PaginatedResponse } from '@/shared/types/paginated-response';
import type { ApiErrorResponse } from '@/shared/types/api-error-response';

type BatchUnit = 'KG' | 'G' | 'ML' | 'L' | 'UNIDADES';

const UNITS: { value: BatchUnit; label: string }[] = [
  { value: 'KG',       label: 'Kg'       },
  { value: 'G',        label: 'g'        },
  { value: 'ML',       label: 'mL'       },
  { value: 'L',        label: 'L'        },
  { value: 'UNIDADES', label: 'Unidades' },
];

const CATEGORY_LABELS: Record<string, string> = {
  CALCA: 'Calça', CAMISETA: 'Camiseta', MOLETOM: 'Moletom', CASACO: 'Casaco',
  TENIS: 'Tênis', SAPATO: 'Sapato', BOTA: 'Bota', ACESSORIO: 'Acessório', JAQUETA: 'Jaqueta',
};

const GENDER_LABELS: Record<string, string> = {
  MASCULINO: 'Masculino', FEMININO: 'Feminino', UNISSEX: 'Unissex',
};

const CONDITION_LABELS: Record<string, string> = {
  NOVO: 'Novo', USADO: 'Usado',
};

const UNIT_LABELS: Record<string, string> = {
  KG: 'kg', G: 'g', ML: 'mL', L: 'L', UNIDADES: 'unidades',
};

interface BatchRow {
  id: string;
  productId: string;
  productType: 'CLOTHES' | 'FOOD' | '';
  unit: string;
  quantity: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (entry: DonationEntryResponse) => void;
}

/* ─── Helpers ────────────────────────────────────────────────────── */

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium
      bg-slate-100 text-slate-500 ring-1 ring-slate-200">
      {children}
    </span>
  );
}

function formatExpiration(dateStr: string): string {
  try {
    return new Date(dateStr + 'T00:00:00')
      .toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  } catch {
    return dateStr;
  }
}

/* ─── Product Picker ─────────────────────────────────────────────── */

interface ProductPickerProps {
  clothesProducts: ClothesDetailResponse[];
  foodProducts: FoodDetailResponse[];
  productsLoading: boolean;
  selectedId: string;
  selectedType: 'CLOTHES' | 'FOOD' | '';
  onSelect: (id: number, type: 'CLOTHES' | 'FOOD') => void;
  onCreateNew: () => void;
  disabled: boolean;
  error?: string;
}

function ProductPicker({
  clothesProducts, foodProducts, productsLoading,
  selectedId, selectedType, onSelect, onCreateNew, disabled, error,
}: ProductPickerProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab]   = useState<'CLOTHES' | 'FOOD'>('CLOTHES');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  let selectedName = '';
  if (selectedId && selectedType === 'CLOTHES') {
    selectedName = clothesProducts.find((p) => String(p.id) === selectedId)?.name ?? '';
  } else if (selectedId && selectedType === 'FOOD') {
    selectedName = foodProducts.find((p) => String(p.id) === selectedId)?.name ?? '';
  }

  return (
    <div ref={ref} className="relative">

      {/* Trigger */}
      <button
        type="button"
        disabled={disabled || productsLoading}
        onClick={() => setOpen((v) => !v)}
        className={[
          'w-full flex items-center justify-between gap-2',
          'px-3 py-2.5 rounded-lg border text-sm transition-colors duration-150',
          'focus:outline-none focus:ring-2',
          open
            ? 'border-wine-700 ring-2 ring-wine-700/20 bg-white'
            : 'border-slate-300 bg-white hover:border-slate-400',
          error ? 'border-red-400 ring-red-200' : '',
          'disabled:opacity-50 disabled:cursor-not-allowed',
        ].join(' ')}
      >
        <span className={`truncate flex-1 text-left ${selectedName ? 'text-slate-900' : 'text-slate-400'}`}>
          {productsLoading ? 'Carregando...' : selectedName || 'Selecione um produto'}
        </span>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className={`w-3.5 h-3.5 shrink-0 text-slate-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {/* Panel */}
      {open && (
        <div className="absolute z-50 bottom-full mb-1.5 left-0 flex flex-col
          bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden"
          style={{ maxHeight: '300px', minWidth: '420px', width: 'max-content', maxWidth: '540px' }}>

          {/* Tab switcher */}
          <div className="flex-none flex items-center gap-1 p-1.5 bg-slate-100 mx-2 mt-2 rounded-lg">
            {(['CLOTHES', 'FOOD'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={[
                  'flex-1 py-1.5 text-xs font-semibold rounded-md transition-all duration-150',
                  tab === t
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700',
                ].join(' ')}
              >
                {t === 'CLOTHES' ? 'Roupas' : 'Alimentos'}
              </button>
            ))}
          </div>

          {/* Scrollable list */}
          <div className="flex-1 overflow-y-auto py-1 mt-1 min-h-0">
            {tab === 'CLOTHES' ? (
              clothesProducts.length === 0 ? (
                <p className="px-4 py-8 text-center text-xs text-slate-400">
                  Nenhuma roupa cadastrada
                </p>
              ) : (
                clothesProducts.map((p) => {
                  const isSelected = selectedId === String(p.id) && selectedType === 'CLOTHES';
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => { onSelect(p.id, 'CLOTHES'); setOpen(false); }}
                      className={[
                        'w-full text-left px-3 py-2.5 transition-colors duration-100',
                        'border-l-2',
                        isSelected
                          ? 'bg-wine-50 border-wine-700'
                          : 'border-transparent hover:bg-slate-50',
                      ].join(' ')}
                    >
                      <p className="text-sm font-medium text-slate-800 leading-tight mb-1.5">{p.name}</p>
                      <div className="flex flex-wrap gap-1">
                        {p.size      && <Tag>Tam: {p.size}</Tag>}
                        {p.category  && <Tag>Categoria: {CATEGORY_LABELS[p.category] ?? p.category}</Tag>}
                        {p.gender    && <Tag>Gênero: {GENDER_LABELS[p.gender] ?? p.gender}</Tag>}
                        {p.condition && <Tag>Cond: {CONDITION_LABELS[p.condition]}</Tag>}
                      </div>
                    </button>
                  );
                })
              )
            ) : (
              foodProducts.length === 0 ? (
                <p className="px-4 py-8 text-center text-xs text-slate-400">
                  Nenhum alimento cadastrado
                </p>
              ) : (
                foodProducts.map((p) => {
                  const isSelected = selectedId === String(p.id) && selectedType === 'FOOD';
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => { onSelect(p.id, 'FOOD'); setOpen(false); }}
                      className={[
                        'w-full text-left px-3 py-2.5 transition-colors duration-100',
                        'border-l-2',
                        isSelected
                          ? 'bg-wine-50 border-wine-700'
                          : 'border-transparent hover:bg-slate-50',
                      ].join(' ')}
                    >
                      <p className="text-sm font-medium text-slate-800 leading-tight mb-1.5">{p.name}</p>
                      <div className="flex flex-wrap gap-1">
                        {p.batch          && <Tag>Lote: {p.batch}</Tag>}
                        {p.expirationDate && <Tag>Val: {formatExpiration(p.expirationDate)}</Tag>}
                        {p.defaultUnit    && <Tag>Unidade: {UNIT_LABELS[p.defaultUnit] ?? p.defaultUnit}</Tag>}
                      </div>
                    </button>
                  );
                })
              )
            )}
          </div>

          {/* Sticky footer */}
          <div className="flex-none border-t border-slate-100 px-3 py-2 bg-white">
            <button
              type="button"
              onClick={() => { setOpen(false); onCreateNew(); }}
              className="flex items-center gap-1.5 text-xs font-semibold text-wine-700
                hover:text-wine-900 transition-colors duration-150"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                className="w-3 h-3"><path d="M5 12h14M12 5v14" /></svg>
              Criar novo produto
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main Modal ─────────────────────────────────────────────────── */

export function NewDonationEntryModal({ open, onClose, onCreated }: Props) {
  const { token, user } = useAuth();
  const toast = useToast();
  const isAdmin = user?.roles.includes('ADMIN') ?? false;

  const [donator, setDonator]           = useState('');
  const [donatorError, setDonatorError] = useState<string | undefined>();
  const [observation, setObservation]   = useState('');
  const [selectedParishId, setSelectedParishId] = useState('');
  const [parishError, setParishError]   = useState<string | undefined>();
  const [batches, setBatches]           = useState<BatchRow[]>([
    { id: crypto.randomUUID(), productId: '', productType: '', unit: '', quantity: '' },
  ]);
  const [batchErrors, setBatchErrors]   = useState<Record<string, { productId?: string; unit?: string; quantity?: string }>>({});
  const [isPending, setIsPending]       = useState(false);

  const [clothesProducts, setClothesProducts] = useState<ClothesDetailResponse[]>([]);
  const [foodProducts, setFoodProducts]       = useState<FoodDetailResponse[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [parishes, setParishes]               = useState<ParishResponse[]>([]);
  const [productModalOpen, setProductModalOpen] = useState(false);

  useEffect(() => {
    if (!open || !token) return;
    setProductsLoading(true);
    Promise.all([
      api.get<PaginatedResponse<ClothesDetailResponse>>('/api/v1/products/clothes?page=0&size=200', token),
      api.get<PaginatedResponse<FoodDetailResponse>>('/api/v1/products/foods?page=0&size=200', token),
    ])
      .then(([clothes, food]) => {
        setClothesProducts(clothes.data);
        setFoodProducts(food.data);
      })
      .catch(() => {})
      .finally(() => setProductsLoading(false));

    if (isAdmin) {
      api.get<PaginatedResponse<ParishResponse>>('/api/v1/parishes?page=0&size=200', token)
        .then((res) => setParishes(res.data))
        .catch(() => {});
    }
  }, [open, token, isAdmin]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isPending && !productModalOpen) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, isPending, productModalOpen, onClose]);

  function resetForm() {
    setDonator('');
    setDonatorError(undefined);
    setObservation('');
    setSelectedParishId('');
    setParishError(undefined);
    setBatches([{ id: crypto.randomUUID(), productId: '', productType: '', unit: '', quantity: '' }]);
    setBatchErrors({});
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function addBatch() {
    setBatches((prev) => [
      ...prev,
      { id: crypto.randomUUID(), productId: '', productType: '', unit: '', quantity: '' },
    ]);
  }

  function removeBatch(id: string) {
    setBatches((prev) => prev.filter((b) => b.id !== id));
    setBatchErrors((prev) => { const e = { ...prev }; delete e[id]; return e; });
  }

  function selectProduct(batchId: string, productId: number, productType: 'CLOTHES' | 'FOOD') {
    setBatches((prev) => prev.map((b) => {
      if (b.id !== batchId) return b;
      const unit = productType === 'CLOTHES' ? 'UNIDADES' : b.unit;
      return { ...b, productId: String(productId), productType, unit };
    }));
    setBatchErrors((prev) => ({ ...prev, [batchId]: { ...prev[batchId], productId: undefined } }));
  }

  function updateBatch(id: string, field: 'unit' | 'quantity', value: string) {
    setBatches((prev) => prev.map((b) => b.id !== id ? b : { ...b, [field]: value }));
    setBatchErrors((prev) => ({ ...prev, [id]: { ...prev[id], [field]: undefined } }));
  }

  function handleProductCreated(product: ProductResponse) {
    if (product.type === 'CLOTHES') {
      setClothesProducts((prev) => [...prev, product as unknown as ClothesDetailResponse]);
    } else if (product.type === 'FOOD') {
      setFoodProducts((prev) => [...prev, product as unknown as FoodDetailResponse]);
    }
    if (product.type) {
      setBatches((prev) => {
        const idx = [...prev].reverse().findIndex((b) => !b.productId);
        if (idx === -1) return prev;
        const realIdx = prev.length - 1 - idx;
        const unit = product.type === 'CLOTHES' ? 'UNIDADES' : '';
        return prev.map((b, i) =>
          i === realIdx
            ? { ...b, productId: String(product.id), productType: product.type!, unit }
            : b
        );
      });
    }
    setProductModalOpen(false);
  }

  function validate() {
    let valid = true;

    if (!donator.trim()) {
      setDonatorError('Doador obrigatório');
      valid = false;
    } else {
      setDonatorError(undefined);
    }

    if (isAdmin && !selectedParishId) {
      setParishError('Selecione uma paróquia');
      valid = false;
    } else {
      setParishError(undefined);
    }

    const errors: typeof batchErrors = {};
    if (batches.length === 0) {
      toast.error('Lotes obrigatórios', 'Adicione ao menos um lote.');
      return false;
    }
    batches.forEach((b) => {
      const e: { productId?: string; unit?: string; quantity?: string } = {};
      if (!b.productId) { e.productId = 'Selecione um produto'; valid = false; }
      if (!b.unit)      { e.unit = 'Selecione a unidade';       valid = false; }
      const qty = Number(b.quantity);
      if (!b.quantity || isNaN(qty) || qty < 1) { e.quantity = 'Qtd. mínima: 1'; valid = false; }
      if (Object.keys(e).length) errors[b.id] = e;
    });
    setBatchErrors(errors);
    return valid;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate() || !token) return;
    setIsPending(true);
    try {
      const created = await api.post<DonationEntryResponse>('/api/v1/donations/entries', {
        donator: donator.trim() || null,
        observation: observation.trim() || null,
        parishId: isAdmin ? Number(selectedParishId) : null,
        batches: batches.map((b) => ({
          productId: Number(b.productId),
          unit: b.unit,
          quantity: Number(b.quantity),
        })),
      }, token);
      toast.success('Entrada registrada!', 'A entrada foi registrada com sucesso.');
      onCreated(created);
      handleClose();
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      const detail = apiErr?.errors?.map((v) => `${v.field}: ${v.message}`).join(' · ');
      toast.error(apiErr?.title ?? 'Erro ao registrar entrada', detail || apiErr?.message);
    } finally {
      setIsPending(false);
    }
  }

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => { if (!isPending && !productModalOpen) handleClose(); }}
          aria-hidden="true"
        />
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[92dvh] overflow-y-auto">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
            <div>
              <h2 className="text-base font-bold text-slate-900">Registrar entrada</h2>
              <p className="text-xs text-slate-500 mt-0.5">Registre uma nova doação recebida</p>
            </div>
            <button
              onClick={() => { if (!isPending && !productModalOpen) handleClose(); }}
              disabled={isPending}
              aria-label="Fechar"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100
                transition-colors duration-150 disabled:opacity-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className="w-5 h-5"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="px-6 py-5 space-y-5">

              {/* Parish — ADMIN only */}
              {isAdmin && (
                <Field label="Paróquia" required error={parishError}>
                  <select
                    value={selectedParishId}
                    onChange={(e) => { setSelectedParishId(e.target.value); setParishError(undefined); }}
                    disabled={isPending}
                    className={[
                      inputClass,
                      parishError ? 'border-red-400 focus:ring-red-500 focus:border-red-500' : '',
                    ].join(' ')}
                  >
                    <option value="">Selecione uma paróquia</option>
                    {parishes.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </Field>
              )}

              {/* Donator */}
              <Field label="Doador" required error={donatorError}>
                <input
                  type="text"
                  placeholder="Nome do doador"
                  disabled={isPending}
                  value={donator}
                  onChange={(e) => { setDonator(e.target.value); setDonatorError(undefined); }}
                  className={[
                    inputClass,
                    donatorError ? 'border-red-400 focus:ring-red-500 focus:border-red-500' : '',
                  ].join(' ')}
                />
              </Field>

              <Field label="Observação">
                <textarea
                  placeholder="Observações gerais (opcional)"
                  disabled={isPending}
                  rows={2}
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  className={inputClass + ' resize-none'}
                />
              </Field>

              {/* Batches */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Lotes<span className="ml-1.5 text-red-500">*</span>
                  </p>
                  <button
                    type="button"
                    onClick={addBatch}
                    disabled={isPending}
                    className="flex items-center gap-1.5 text-xs font-semibold text-wine-700
                      hover:text-wine-800 transition-colors duration-150 disabled:opacity-50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      className="w-3.5 h-3.5"><path d="M5 12h14M12 5v14" /></svg>
                    Adicionar lote
                  </button>
                </div>

                <div className="space-y-3">
                  {batches.map((batch, index) => (
                    <div key={batch.id}
                      className="flex gap-3 items-start p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="mt-2.5 text-xs font-bold text-slate-400 w-5 shrink-0 text-center">
                        {index + 1}
                      </span>

                      {/* Product picker */}
                      <div className="flex-1 space-y-1 min-w-0">
                        <ProductPicker
                          clothesProducts={clothesProducts}
                          foodProducts={foodProducts}
                          productsLoading={productsLoading}
                          selectedId={batch.productId}
                          selectedType={batch.productType}
                          onSelect={(id, type) => selectProduct(batch.id, id, type)}
                          onCreateNew={() => setProductModalOpen(true)}
                          disabled={isPending}
                          error={batchErrors[batch.id]?.productId}
                        />
                        {batchErrors[batch.id]?.productId && (
                          <p className="text-xs text-red-600 font-medium">{batchErrors[batch.id]!.productId}</p>
                        )}
                      </div>

                      {/* Unit */}
                      <div className="w-28 space-y-1 shrink-0">
                        <select
                          value={batch.unit}
                          onChange={(e) => updateBatch(batch.id, 'unit', e.target.value)}
                          disabled={isPending || batch.productType === 'CLOTHES'}
                          className={[
                            inputClass,
                            batch.productType === 'CLOTHES' ? 'bg-slate-100 text-slate-500 cursor-default' : '',
                            batchErrors[batch.id]?.unit
                              ? 'border-red-400 focus:ring-red-500 focus:border-red-500'
                              : '',
                          ].join(' ')}
                        >
                          <option value="">Unidade</option>
                          {UNITS.map((u) => (
                            <option key={u.value} value={u.value}>{u.label}</option>
                          ))}
                        </select>
                        {batchErrors[batch.id]?.unit && (
                          <p className="text-xs text-red-600 font-medium">{batchErrors[batch.id]!.unit}</p>
                        )}
                      </div>

                      {/* Quantity */}
                      <div className="w-24 space-y-1 shrink-0">
                        <input
                          type="number"
                          min={1}
                          placeholder="Qtd."
                          disabled={isPending}
                          value={batch.quantity}
                          onChange={(e) => updateBatch(batch.id, 'quantity', e.target.value)}
                          className={[
                            inputClass,
                            batchErrors[batch.id]?.quantity
                              ? 'border-red-400 focus:ring-red-500 focus:border-red-500'
                              : '',
                          ].join(' ')}
                        />
                        {batchErrors[batch.id]?.quantity && (
                          <p className="text-xs text-red-600 font-medium">{batchErrors[batch.id]!.quantity}</p>
                        )}
                      </div>

                      {/* Remove */}
                      {batches.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeBatch(batch.id)}
                          disabled={isPending}
                          aria-label="Remover lote"
                          className="mt-2 p-1 rounded text-slate-400 hover:text-red-500
                            hover:bg-red-50 transition-colors duration-150 shrink-0 disabled:opacity-50"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            className="w-4 h-4">
                            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                            <path d="M10 11v6M14 11v6" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
              <button
                type="button"
                onClick={() => { if (!isPending && !productModalOpen) handleClose(); }}
                disabled={isPending}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800
                  rounded-lg hover:bg-slate-200 transition-colors duration-150
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white
                  bg-wine-800 hover:bg-wine-900 rounded-lg transition-colors duration-150
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-wine-700
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <>
                    <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Salvando...
                  </>
                ) : 'Registrar entrada'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <NewProductModal
        open={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        onCreated={handleProductCreated}
      />
    </>
  );
}
