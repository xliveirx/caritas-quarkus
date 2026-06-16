'use client';

import { useState, useEffect, useRef, type FormEvent } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import { api } from '@/services/api';
import { Field, inputClass } from '@/components/ui/field';
import type { BazarSaleResponse } from '@/shared/types/bazar-sale-response';
import type { ClothesStockItem } from '@/shared/types/clothes-stock-item';
import type { ParishResponse } from '@/shared/types/parish-response';
import type { PaginatedResponse } from '@/shared/types/paginated-response';
import type { ApiErrorResponse } from '@/shared/types/api-error-response';

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

interface SaleItemRow {
  id: string;
  stockItemId: string;
  availableQty: number;
  productName: string;
  quantity: string;
  unitPrice: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (sale: BazarSaleResponse) => void;
}

/* ─── Stock Item Picker ──────────────────────────────────────────── */

interface StockItemPickerProps {
  items: ClothesStockItem[];
  loading: boolean;
  error: boolean;
  noParishSelected?: boolean;
  onRetry: () => void;
  selectedId: string;
  onSelect: (stockItemId: number, availableQty: number, name: string) => void;
  disabled: boolean;
  errorMsg?: string;
}

function StockItemPicker({ items, loading, error, noParishSelected, onRetry, selectedId, onSelect, disabled, errorMsg }: StockItemPickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  const selectedName = items.find((i) => String(i.id) === selectedId)?.clothes.name ?? '';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => setOpen((v) => !v)}
        className={[
          'w-full flex items-center justify-between gap-2',
          'px-3 py-2.5 rounded-lg border text-sm transition-colors duration-150',
          'focus:outline-none focus:ring-2',
          open ? 'border-wine-700 ring-2 ring-wine-700/20 bg-white' : 'border-slate-300 bg-white hover:border-slate-400',
          errorMsg ? 'border-red-400 ring-2 ring-red-200' : '',
          'disabled:opacity-50 disabled:cursor-not-allowed',
        ].join(' ')}
      >
        <span className={`truncate flex-1 text-left ${selectedName ? 'text-slate-900' : 'text-slate-400'}`}>
          {loading ? 'Carregando...' : selectedName || (noParishSelected ? 'Selecione uma paróquia primeiro' : 'Selecione uma roupa do estoque')}
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
          style={{ maxHeight: '300px', minWidth: '380px', width: 'max-content', maxWidth: '500px' }}>

          <div className="flex-none flex items-center gap-1 p-1.5 bg-slate-100 mx-2 mt-2 rounded-lg">
            <span className="flex-1 py-1.5 text-xs font-semibold rounded-md bg-white text-slate-800 shadow-sm text-center">
              Roupas
            </span>
          </div>

          <div className="flex-1 overflow-y-auto py-1 mt-1 min-h-0">
            {error ? (
              <div className="flex flex-col items-center justify-center py-8 px-4 gap-2 text-center">
                <p className="text-xs text-slate-500">Falha ao carregar estoque.</p>
                <button type="button" onClick={onRetry}
                  className="text-xs font-semibold text-wine-700 hover:text-wine-900 transition-colors">
                  Tentar novamente
                </button>
              </div>
            ) : items.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-slate-400">Nenhuma roupa em estoque</p>
            ) : (
              items.map((item) => {
                const isSelected = selectedId === String(item.id);
                const attrs = item.clothes.attributes.map((a) => a.label).join(' · ');
                return (
                  <button key={item.id} type="button"
                    onClick={() => { onSelect(item.id, item.availableQuantity, item.clothes.name); setOpen(false); }}
                    className={[
                      'w-full text-left px-3 py-2.5 transition-colors duration-100 border-l-2',
                      'flex items-center justify-between gap-3',
                      isSelected ? 'bg-wine-50 border-wine-700' : 'border-transparent hover:bg-slate-50',
                    ].join(' ')}>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 leading-tight">{item.clothes.name}</p>
                      {attrs && <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">{attrs}</p>}
                    </div>
                    <span className={[
                      'shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border',
                      item.availableQuantity === 0
                        ? 'bg-red-50 text-red-700 border-red-100'
                        : item.availableQuantity <= 3
                        ? 'bg-amber-50 text-amber-700 border-amber-100'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-100',
                    ].join(' ')}>
                      <span className={[
                        'w-1.5 h-1.5 rounded-full',
                        item.availableQuantity === 0 ? 'bg-red-500' : item.availableQuantity <= 3 ? 'bg-amber-500' : 'bg-emerald-500',
                      ].join(' ')} />
                      {item.availableQuantity} un.
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main Modal ─────────────────────────────────────────────────── */

export function NewBazarSaleModal({ open, onClose, onCreated }: Props) {
  const { token, user } = useAuth();
  const toast = useToast();
  const isAdmin = user?.roles.includes('ADMIN') ?? false;

  const [buyerName, setBuyerName]               = useState('');
  const [buyerNameError, setBuyerNameError]     = useState<string | undefined>();
  const [buyerCpf, setBuyerCpf]                 = useState('');
  const [buyerCpfError, setBuyerCpfError]       = useState<string | undefined>();
  const [selectedParishId, setSelectedParishId] = useState('');
  const [parishError, setParishError]           = useState<string | undefined>();
  const [items, setItems] = useState<SaleItemRow[]>([
    { id: crypto.randomUUID(), stockItemId: '', availableQty: 0, productName: '', quantity: '', unitPrice: '' },
  ]);
  const [itemErrors, setItemErrors] = useState<Record<string, { stockItemId?: string; quantity?: string; unitPrice?: string }>>({});
  const [isPending, setIsPending]   = useState(false);

  const [clothesItems, setClothesItems] = useState<ClothesStockItem[]>([]);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockError, setStockError]     = useState(false);
  const [parishes, setParishes]         = useState<ParishResponse[]>([]);

  function fetchStock(parishId?: string) {
    if (!token) return;
    setStockLoading(true);
    setStockError(false);
    const qs = new URLSearchParams({ page: '0', size: '200' });
    if (parishId) qs.set('parishId', parishId);
    api.get<PaginatedResponse<ClothesStockItem>>(`/api/v1/stock/clothes?${qs}`, token)
      .then((res) => setClothesItems(res.data))
      .catch(() => setStockError(true))
      .finally(() => setStockLoading(false));
  }

  // fetch parishes list (admin only) on open
  useEffect(() => {
    if (!open || !token || !isAdmin) return;
    api.get<PaginatedResponse<ParishResponse>>('/api/v1/parishes?page=0&size=200', token)
      .then((res) => setParishes(res.data))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, token, isAdmin]);

  // fetch stock: non-admin on open (backend resolves parish from JWT);
  // admin only after a parish is selected, refetching when it changes
  useEffect(() => {
    if (!open || !token) return;
    if (isAdmin && !selectedParishId) {
      setClothesItems([]);
      return;
    }
    fetchStock(isAdmin ? selectedParishId : undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, token, isAdmin, selectedParishId]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && !isPending) onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, isPending, onClose]);

  function resetForm() {
    setBuyerName(''); setBuyerNameError(undefined);
    setBuyerCpf(''); setBuyerCpfError(undefined);
    setSelectedParishId(''); setParishError(undefined);
    setItems([{ id: crypto.randomUUID(), stockItemId: '', availableQty: 0, productName: '', quantity: '', unitPrice: '' }]);
    setItemErrors({});
  }

  function handleClose() { resetForm(); onClose(); }

  function addItem() {
    setItems((prev) => [...prev, {
      id: crypto.randomUUID(), stockItemId: '', availableQty: 0, productName: '', quantity: '', unitPrice: '',
    }]);
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setItemErrors((prev) => { const e = { ...prev }; delete e[id]; return e; });
  }

  function selectStockItem(rowId: string, stockItemId: number, availableQty: number, name: string) {
    setItems((prev) => prev.map((i) =>
      i.id !== rowId ? i : { ...i, stockItemId: String(stockItemId), availableQty, productName: name }
    ));
    setItemErrors((prev) => ({ ...prev, [rowId]: { ...prev[rowId], stockItemId: undefined } }));
  }

  function updateItem(rowId: string, field: 'quantity' | 'unitPrice', value: string) {
    setItems((prev) => prev.map((i) => i.id !== rowId ? i : { ...i, [field]: value }));
    setItemErrors((prev) => ({ ...prev, [rowId]: { ...prev[rowId], [field]: undefined } }));
  }

  const runningTotal = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    return sum + qty * price;
  }, 0);

  function validate(): boolean {
    let valid = true;
    if (!buyerName.trim()) { setBuyerNameError('Nome obrigatório'); valid = false; }
    else setBuyerNameError(undefined);
    if (!buyerCpf.trim()) { setBuyerCpfError('CPF obrigatório'); valid = false; }
    else setBuyerCpfError(undefined);
    if (isAdmin && !selectedParishId) { setParishError('Selecione uma paróquia ou diocese'); valid = false; }
    else setParishError(undefined);

    if (items.length === 0) {
      toast.error('Itens obrigatórios', 'Adicione ao menos um item à venda.');
      return false;
    }

    const usedIds: string[] = [];
    const errors: typeof itemErrors = {};
    items.forEach((item) => {
      const e: { stockItemId?: string; quantity?: string; unitPrice?: string } = {};
      if (!item.stockItemId) {
        e.stockItemId = 'Selecione um item'; valid = false;
      } else if (usedIds.includes(item.stockItemId)) {
        e.stockItemId = 'Item duplicado'; valid = false;
      } else {
        usedIds.push(item.stockItemId);
      }
      const qty = Number(item.quantity);
      if (!item.quantity || isNaN(qty) || qty <= 0) {
        e.quantity = 'Qtd. deve ser maior que 0'; valid = false;
      } else if (qty > item.availableQty) {
        e.quantity = `Máx. disponível: ${item.availableQty}`; valid = false;
      }
      const price = Number(item.unitPrice);
      if (!item.unitPrice || isNaN(price) || price <= 0) {
        e.unitPrice = 'Preço deve ser maior que 0'; valid = false;
      }
      if (Object.keys(e).length) errors[item.id] = e;
    });
    setItemErrors(errors);
    return valid;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate() || !token) return;
    setIsPending(true);
    try {
      const created = await api.post<BazarSaleResponse>('/api/v1/bazar', {
        buyerName: buyerName.trim(),
        buyerCpf: buyerCpf.trim(),
        parishId: isAdmin ? Number(selectedParishId) : null,
        items: items.map((i) => ({
          stockItemId: Number(i.stockItemId),
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
        })),
      }, token);
      toast.success('Venda registrada!', `Venda para "${created.buyerName}" registrada com sucesso.`);
      onCreated(created);
      handleClose();
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      const detail = apiErr?.errors?.map((v) => `${v.field}: ${v.message}`).join(' · ');
      toast.error(apiErr?.title ?? 'Erro ao registrar venda', detail || apiErr?.message);
    } finally {
      setIsPending(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => { if (!isPending) handleClose(); }} aria-hidden="true" />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[92dvh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
          <div>
            <h2 className="text-base font-bold text-slate-900">Registrar venda</h2>
            <p className="text-xs text-slate-500 mt-0.5">Registre uma venda do bazar/brechó</p>
          </div>
          <button onClick={() => { if (!isPending) handleClose(); }} disabled={isPending}
            aria-label="Fechar"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100
              transition-colors duration-150 disabled:opacity-50">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="w-5 h-5"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="px-6 py-5 space-y-5">

            {isAdmin && (
              <Field label="Paróquia / Diocese" required error={parishError}>
                <select value={selectedParishId}
                  onChange={(e) => {
                setSelectedParishId(e.target.value);
                setParishError(undefined);
                setItems([{ id: crypto.randomUUID(), stockItemId: '', availableQty: 0, productName: '', quantity: '', unitPrice: '' }]);
                setItemErrors({});
              }}
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

            <div className="grid grid-cols-2 gap-4">
              <Field label="Nome do comprador" required error={buyerNameError}>
                <input type="text" placeholder="Nome completo" disabled={isPending} value={buyerName}
                  onChange={(e) => { setBuyerName(e.target.value); setBuyerNameError(undefined); }}
                  className={[inputClass, buyerNameError ? 'border-red-400 focus:ring-red-500 focus:border-red-500' : ''].join(' ')} />
              </Field>
              <Field label="CPF" required error={buyerCpfError}>
                <input type="text" placeholder="000.000.000-00" disabled={isPending} value={buyerCpf}
                  onChange={(e) => { setBuyerCpf(e.target.value); setBuyerCpfError(undefined); }}
                  className={[inputClass, buyerCpfError ? 'border-red-400 focus:ring-red-500 focus:border-red-500' : ''].join(' ')} />
              </Field>
            </div>

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

                    <div className="flex-1 space-y-1 min-w-0">
                      <StockItemPicker
                        items={clothesItems} loading={stockLoading} error={stockError}
                        noParishSelected={isAdmin && !selectedParishId}
                        onRetry={() => fetchStock(isAdmin ? selectedParishId : undefined)}
                        selectedId={item.stockItemId}
                        onSelect={(id, qty, name) => selectStockItem(item.id, id, qty, name)}
                        disabled={isPending || (isAdmin && !selectedParishId)}
                        errorMsg={itemErrors[item.id]?.stockItemId}
                      />
                      {itemErrors[item.id]?.stockItemId && (
                        <p className="text-xs text-red-600 font-medium">{itemErrors[item.id]!.stockItemId}</p>
                      )}
                    </div>

                    {/* Quantity */}
                    <div className="w-24 space-y-1 shrink-0">
                      <input type="number" min={1} step="1" placeholder="Qtd."
                        disabled={isPending} value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                        className={[
                          inputClass,
                          itemErrors[item.id]?.quantity ? 'border-red-400 focus:ring-red-500 focus:border-red-500' : '',
                        ].join(' ')} />
                      {itemErrors[item.id]?.quantity && (
                        <p className="text-xs text-red-600 font-medium">{itemErrors[item.id]!.quantity}</p>
                      )}
                    </div>

                    {/* Unit price */}
                    <div className="w-28 space-y-1 shrink-0">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none select-none">
                          R$
                        </span>
                        <input type="number" min={0.01} step="0.01" placeholder="0,00"
                          disabled={isPending} value={item.unitPrice}
                          onChange={(e) => updateItem(item.id, 'unitPrice', e.target.value)}
                          className={[
                            inputClass, 'pl-8',
                            itemErrors[item.id]?.unitPrice ? 'border-red-400 focus:ring-red-500 focus:border-red-500' : '',
                          ].join(' ')} />
                      </div>
                      {itemErrors[item.id]?.unitPrice && (
                        <p className="text-xs text-red-600 font-medium">{itemErrors[item.id]!.unitPrice}</p>
                      )}
                    </div>

                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(item.id)} disabled={isPending}
                        aria-label="Remover item"
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

              {items.some((i) => i.quantity && i.unitPrice) && (
                <div className="flex items-center justify-end mt-3 pt-3 border-t border-slate-200">
                  <span className="text-xs text-slate-500 mr-2">Total estimado:</span>
                  <span className="text-sm font-bold text-slate-900">{BRL.format(runningTotal)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
            <button type="button" onClick={() => { if (!isPending) handleClose(); }} disabled={isPending}
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
              ) : 'Registrar venda'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
