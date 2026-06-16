'use client';

import { useState, useEffect, useRef, type FormEvent } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import { api } from '@/services/api';
import { Field, inputClass } from '@/components/ui/field';
import { NewProductModal } from '@/components/new-product-modal';
import type { KitResponse } from '@/shared/types/kit-response';
import type { ProductResponse } from '@/shared/types/product-response';
import type { ClothesDetailResponse } from '@/shared/types/clothes-detail-response';
import type { FoodDetailResponse } from '@/shared/types/food-detail-response';
import type { ParishResponse } from '@/shared/types/parish-response';
import type { PaginatedResponse } from '@/shared/types/paginated-response';
import type { ApiErrorResponse } from '@/shared/types/api-error-response';

const UNIT_LABELS: Record<string, string> = {
  KG: 'kg', G: 'g', ML: 'mL', L: 'L', UNIDADES: 'un.',
};

interface ItemRow {
  id: string;
  productId: string;
  productType: 'CLOTHES' | 'FOOD' | '';
  defaultUnit: string | null;
  quantity: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (kit: KitResponse) => void;
}

function formatExpiration(dateStr: string): string {
  try {
    return new Date(dateStr + 'T00:00:00')
      .toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  } catch {
    return dateStr;
  }
}

function ClothesProductDetails({ p }: { p: ClothesDetailResponse }) {
  if (p.attributes.length === 0) return null;
  return (
    <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
      {p.attributes.map((a) => a.label).join(' · ')}
    </p>
  );
}

function FoodProductDetails({ p }: { p: FoodDetailResponse }) {
  const parts: string[] = [];
  if (p.batch)          parts.push(`Lote ${p.batch}`);
  if (p.expirationDate) parts.push(`Val. ${formatExpiration(p.expirationDate)}`);
  if (p.defaultUnit)    parts.push(UNIT_LABELS[p.defaultUnit] ?? p.defaultUnit);
  if (parts.length === 0) return null;
  return <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">{parts.join(' · ')}</p>;
}

/* ─── ProductPicker ────────────────────────────────────────────────── */

interface ProductPickerProps {
  clothesProducts: ClothesDetailResponse[];
  foodProducts: FoodDetailResponse[];
  productsLoading: boolean;
  productsError: boolean;
  onRetry: () => void;
  onCreateNew: (tab: 'CLOTHES' | 'FOOD') => void;
  selectedId: string;
  selectedType: 'CLOTHES' | 'FOOD' | '';
  onSelect: (id: number, type: 'CLOTHES' | 'FOOD', defaultUnit: string | null) => void;
  disabled: boolean;
  error?: string;
}

function ProductPicker({
  clothesProducts, foodProducts, productsLoading, productsError, onRetry, onCreateNew,
  selectedId, selectedType, onSelect, disabled, error,
}: ProductPickerProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab]   = useState<'CLOTHES' | 'FOOD'>('FOOD');
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

  function renderList() {
    if (productsError) {
      return (
        <div className="flex flex-col items-center justify-center py-8 px-4 gap-2 text-center">
          <p className="text-xs text-slate-500">Falha ao carregar produtos.</p>
          <button type="button" onClick={onRetry}
            className="text-xs font-semibold text-wine-700 hover:text-wine-900 transition-colors">
            Tentar novamente
          </button>
        </div>
      );
    }

    if (tab === 'FOOD') {
      return foodProducts.length === 0 ? (
        <p className="px-4 py-8 text-center text-xs text-slate-400">Nenhum alimento cadastrado</p>
      ) : (
        foodProducts.map((p) => {
          const isSelected = selectedId === String(p.id) && selectedType === 'FOOD';
          return (
            <button key={p.id} type="button"
              onClick={() => { onSelect(p.id, 'FOOD', p.defaultUnit ?? null); setOpen(false); }}
              className={[
                'w-full text-left px-3 py-2.5 transition-colors duration-100 border-l-2',
                isSelected ? 'bg-wine-50 border-wine-700' : 'border-transparent hover:bg-slate-50',
              ].join(' ')}>
              <p className="text-sm font-medium text-slate-800 leading-tight">{p.name}</p>
              <FoodProductDetails p={p} />
            </button>
          );
        })
      );
    }

    return clothesProducts.length === 0 ? (
      <p className="px-4 py-8 text-center text-xs text-slate-400">Nenhuma roupa cadastrada</p>
    ) : (
      clothesProducts.map((p) => {
        const isSelected = selectedId === String(p.id) && selectedType === 'CLOTHES';
        return (
          <button key={p.id} type="button"
            onClick={() => { onSelect(p.id, 'CLOTHES', 'UNIDADES'); setOpen(false); }}
            className={[
              'w-full text-left px-3 py-2.5 transition-colors duration-100 border-l-2',
              isSelected ? 'bg-wine-50 border-wine-700' : 'border-transparent hover:bg-slate-50',
            ].join(' ')}>
            <p className="text-sm font-medium text-slate-800 leading-tight">{p.name}</p>
            <ClothesProductDetails p={p} />
          </button>
        );
      })
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled || productsLoading}
        onClick={() => setOpen((v) => !v)}
        className={[
          'w-full flex items-center justify-between gap-2',
          'px-3 py-2.5 rounded-lg border text-sm transition-colors duration-150',
          'focus:outline-none focus:ring-2',
          open ? 'border-wine-700 ring-2 ring-wine-700/20 bg-white' : 'border-slate-300 bg-white hover:border-slate-400',
          error ? 'border-red-400 ring-2 ring-red-200' : '',
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

      {open && (
        <div className="absolute z-50 bottom-full mb-1.5 left-0 flex flex-col
          bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden"
          style={{ maxHeight: '300px', minWidth: '420px', width: 'max-content', maxWidth: '540px' }}>

          <div className="flex-none flex items-center gap-1 p-1.5 bg-slate-100 mx-2 mt-2 rounded-lg">
            {(['FOOD', 'CLOTHES'] as const).map((t) => (
              <button key={t} type="button" onClick={() => setTab(t)}
                className={[
                  'flex-1 py-1.5 text-xs font-semibold rounded-md transition-all duration-150',
                  tab === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700',
                ].join(' ')}>
                {t === 'CLOTHES' ? 'Roupas' : 'Alimentos'}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto py-1 mt-1 min-h-0">
            {renderList()}
          </div>

          <div className="flex-none border-t border-slate-100 px-3 py-2 bg-white">
            <button type="button" onClick={() => { setOpen(false); onCreateNew(tab); }}
              className="flex items-center gap-1.5 text-xs font-semibold text-wine-700
                hover:text-wine-900 transition-colors duration-150">
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

/* ─── Main Modal ───────────────────────────────────────────────────── */

export function NewKitModal({ open, onClose, onCreated }: Props) {
  const { token, user } = useAuth();
  const toast = useToast();
  const isAdmin = user?.roles.includes('ADMIN') ?? false;

  const [name, setName]               = useState('');
  const [nameError, setNameError]     = useState<string | undefined>();
  const [description, setDescription] = useState('');
  const [selectedParishId, setSelectedParishId] = useState('');
  const [parishError, setParishError] = useState<string | undefined>();
  const [items, setItems] = useState<ItemRow[]>([
    { id: crypto.randomUUID(), productId: '', productType: '', defaultUnit: null, quantity: '' },
  ]);
  const [itemErrors, setItemErrors] = useState<Record<string, { productId?: string; quantity?: string }>>({});
  const [isPending, setIsPending] = useState(false);

  const [clothesProducts, setClothesProducts] = useState<ClothesDetailResponse[]>([]);
  const [foodProducts, setFoodProducts]       = useState<FoodDetailResponse[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError]     = useState(false);
  const [parishes, setParishes]               = useState<ParishResponse[]>([]);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [productModalInitialType, setProductModalInitialType] = useState<'clothes' | 'food'>('food');

  /* ─── Fetch ─────────────────────────────────────────────────────── */

  function fetchProducts() {
    if (!token) return;
    setProductsLoading(true);
    setProductsError(false);
    Promise.all([
      api.get<PaginatedResponse<ClothesDetailResponse>>('/api/v1/products/clothes?page=0&size=200', token),
      api.get<PaginatedResponse<FoodDetailResponse>>('/api/v1/products/foods?page=0&size=200', token),
    ])
      .then(([clothes, food]) => {
        setClothesProducts(clothes.data);
        setFoodProducts(food.data);
      })
      .catch(() => setProductsError(true))
      .finally(() => setProductsLoading(false));
  }

  useEffect(() => {
    if (!open || !token) return;
    fetchProducts();
    if (isAdmin) {
      api.get<PaginatedResponse<ParishResponse>>('/api/v1/parishes?page=0&size=200', token)
        .then((res) => setParishes(res.data))
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, token, isAdmin]);

  /* ─── Escape ────────────────────────────────────────────────────── */

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isPending && !productModalOpen) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, isPending, productModalOpen, onClose]);

  /* ─── Reset ─────────────────────────────────────────────────────── */

  function resetForm() {
    setName(''); setNameError(undefined);
    setDescription('');
    setSelectedParishId(''); setParishError(undefined);
    setItems([{ id: crypto.randomUUID(), productId: '', productType: '', defaultUnit: null, quantity: '' }]);
    setItemErrors({});
  }

  function handleClose() { resetForm(); onClose(); }

  /* ─── Items helpers ─────────────────────────────────────────────── */

  function addItem() {
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), productId: '', productType: '', defaultUnit: null, quantity: '' },
    ]);
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setItemErrors((prev) => { const e = { ...prev }; delete e[id]; return e; });
  }

  function selectProduct(rowId: string, productId: number, productType: 'CLOTHES' | 'FOOD', defaultUnit: string | null) {
    setItems((prev) => prev.map((i) =>
      i.id !== rowId ? i : { ...i, productId: String(productId), productType, defaultUnit },
    ));
    setItemErrors((prev) => ({ ...prev, [rowId]: { ...prev[rowId], productId: undefined } }));
  }

  function updateQuantity(id: string, value: string) {
    setItems((prev) => prev.map((i) => i.id !== id ? i : { ...i, quantity: value }));
    setItemErrors((prev) => ({ ...prev, [id]: { ...prev[id], quantity: undefined } }));
  }

  /* ─── handleProductCreated ──────────────────────────────────────── */

  function handleProductCreated(product: ProductResponse) {
    if (product.type === 'CLOTHES') {
      setClothesProducts((prev) => [...prev, product as unknown as ClothesDetailResponse]);
    } else if (product.type === 'FOOD') {
      setFoodProducts((prev) => [...prev, product as unknown as FoodDetailResponse]);
    }
    if (product.type) {
      setItems((prev) => {
        const idx = [...prev].reverse().findIndex((i) => !i.productId);
        if (idx === -1) return prev;
        const realIdx = prev.length - 1 - idx;
        return prev.map((i, n) =>
          n === realIdx
            ? { ...i, productId: String(product.id), productType: product.type!, defaultUnit: product.type === 'CLOTHES' ? 'UNIDADES' : null }
            : i
        );
      });
    }
    setProductModalOpen(false);
  }

  /* ─── Validation ────────────────────────────────────────────────── */

  function validate(): boolean {
    let valid = true;

    if (!name.trim()) { setNameError('Nome obrigatório'); valid = false; }
    else setNameError(undefined);

    if (isAdmin && !selectedParishId) { setParishError('Selecione uma paróquia ou diocese'); valid = false; }
    else setParishError(undefined);

    if (items.length === 0) {
      toast.error('Itens obrigatórios', 'Adicione ao menos um item à cesta.');
      return false;
    }

    const usedIds: string[] = [];
    const errors: typeof itemErrors = {};
    items.forEach((item) => {
      const e: { productId?: string; quantity?: string } = {};
      if (!item.productId) {
        e.productId = 'Selecione um produto'; valid = false;
      } else if (usedIds.includes(item.productId)) {
        e.productId = 'Produto duplicado'; valid = false;
      } else {
        usedIds.push(item.productId);
      }
      const qty = Number(item.quantity);
      if (!item.quantity || isNaN(qty) || qty <= 0) {
        e.quantity = 'Quantidade deve ser maior que 0'; valid = false;
      }
      if (Object.keys(e).length) errors[item.id] = e;
    });
    setItemErrors(errors);
    return valid;
  }

  /* ─── Submit ────────────────────────────────────────────────────── */

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate() || !token) return;
    setIsPending(true);
    try {
      const created = await api.post<KitResponse>('/api/v1/kits', {
        name: name.trim(),
        description: description.trim() || null,
        parishId: isAdmin ? Number(selectedParishId) : null,
        items: items.map((i) => ({
          productId: Number(i.productId),
          quantity: Number(i.quantity),
        })),
      }, token);
      toast.success('Cesta criada!', `"${created.name}" foi criada com sucesso.`);
      onCreated(created);
      handleClose();
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      const detail = apiErr?.errors?.map((v) => `${v.field}: ${v.message}`).join(' · ');
      toast.error(apiErr?.title ?? 'Erro ao criar cesta', detail || apiErr?.message);
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
              <h2 className="text-base font-bold text-slate-900">Criar cesta básica</h2>
              <p className="text-xs text-slate-500 mt-0.5">Defina os produtos e quantidades da cesta</p>
            </div>
            <button onClick={() => { if (!isPending && !productModalOpen) handleClose(); }}
              disabled={isPending} aria-label="Fechar"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100
                transition-colors duration-150 disabled:opacity-50">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className="w-5 h-5"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="px-6 py-5 space-y-5">

              {/* Parish / Diocese — ADMIN only */}
              {isAdmin && (
                <Field label="Paróquia / Diocese" required error={parishError}>
                  <select value={selectedParishId}
                    onChange={(e) => { setSelectedParishId(e.target.value); setParishError(undefined); }}
                    disabled={isPending}
                    className={[inputClass, parishError ? 'border-red-400 focus:ring-red-500 focus:border-red-500' : ''].join(' ')}>
                    <option value="">Selecione uma paróquia ou diocese</option>
                    {parishes.filter((p) => p.isDiocese).length > 0 && (
                      <optgroup label="Diocese">
                        {parishes.filter((p) => p.isDiocese).map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </optgroup>
                    )}
                    {parishes.filter((p) => !p.isDiocese).length > 0 && (
                      <optgroup label="Paróquias">
                        {parishes.filter((p) => !p.isDiocese).map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </Field>
              )}

              {/* Name */}
              <Field label="Nome" required error={nameError}>
                <input type="text" placeholder="Ex: Cesta Básica Mensal"
                  disabled={isPending} value={name}
                  onChange={(e) => { setName(e.target.value); setNameError(undefined); }}
                  className={[inputClass, nameError ? 'border-red-400 focus:ring-red-500 focus:border-red-500' : ''].join(' ')}
                />
              </Field>

              {/* Description */}
              <Field label="Descrição">
                <textarea placeholder="Descrição opcional da cesta"
                  disabled={isPending} rows={2} value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={inputClass + ' resize-none'} />
              </Field>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Itens<span className="ml-1.5 text-red-500">*</span>
                  </p>
                  <button type="button" onClick={addItem} disabled={isPending}
                    className="flex items-center gap-1.5 text-xs font-semibold text-wine-700
                      hover:text-wine-800 transition-colors duration-150 disabled:opacity-50">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      className="w-3.5 h-3.5"><path d="M5 12h14M12 5v14" /></svg>
                    Adicionar item
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={item.id}
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
                          productsError={productsError}
                          onRetry={fetchProducts}
                          onCreateNew={(tab) => { setProductModalInitialType(tab === 'CLOTHES' ? 'clothes' : 'food'); setProductModalOpen(true); }}
                          selectedId={item.productId}
                          selectedType={item.productType}
                          onSelect={(id, type, unit) => selectProduct(item.id, id, type, unit)}
                          disabled={isPending}
                          error={itemErrors[item.id]?.productId}
                        />
                        {itemErrors[item.id]?.productId && (
                          <p className="text-xs text-red-600 font-medium">{itemErrors[item.id]!.productId}</p>
                        )}
                      </div>

                      {/* Quantity */}
                      <div className="w-28 space-y-1 shrink-0">
                        <div className="relative">
                          <input type="number" min={0.001} step="any" placeholder="Qtd."
                            disabled={isPending} value={item.quantity}
                            onChange={(e) => updateQuantity(item.id, e.target.value)}
                            className={[
                              inputClass,
                              item.defaultUnit ? 'pr-9' : '',
                              itemErrors[item.id]?.quantity ? 'border-red-400 focus:ring-red-500 focus:border-red-500' : '',
                            ].join(' ')}
                          />
                          {item.defaultUnit && (
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs
                              text-slate-400 pointer-events-none select-none">
                              {UNIT_LABELS[item.defaultUnit] ?? item.defaultUnit}
                            </span>
                          )}
                        </div>
                        {itemErrors[item.id]?.quantity && (
                          <p className="text-xs text-red-600 font-medium">{itemErrors[item.id]!.quantity}</p>
                        )}
                      </div>

                      {/* Remove */}
                      {items.length > 1 && (
                        <button type="button" onClick={() => removeItem(item.id)}
                          disabled={isPending} aria-label="Remover item"
                          className="mt-2 p-1 rounded text-slate-400 hover:text-red-500
                            hover:bg-red-50 transition-colors duration-150 shrink-0 disabled:opacity-50">
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
              <button type="button"
                onClick={() => { if (!isPending && !productModalOpen) handleClose(); }}
                disabled={isPending}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800
                  rounded-lg hover:bg-slate-200 transition-colors duration-150
                  disabled:opacity-50 disabled:cursor-not-allowed">
                Cancelar
              </button>
              <button type="submit" disabled={isPending}
                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white
                  bg-wine-800 hover:bg-wine-900 rounded-lg transition-colors duration-150
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-wine-700
                  disabled:opacity-50 disabled:cursor-not-allowed">
                {isPending ? (
                  <>
                    <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Salvando...
                  </>
                ) : 'Criar cesta'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <NewProductModal
        open={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        onCreated={handleProductCreated}
        initialType={productModalInitialType}
      />
    </>
  );
}
