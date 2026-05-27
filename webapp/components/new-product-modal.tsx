'use client';

import { useState, type FormEvent } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import { api } from '@/services/api';
import { Field, inputClass } from '@/components/ui/field';
import type { ProductResponse } from '@/shared/types/product-response';
import type { ApiErrorResponse } from '@/shared/types/api-error-response';

type ProductType = 'clothes' | 'food';

const SIZES    = ['P', 'M', 'G', 'GG', 'GGG'];
const CATEGORIES = ['CALCA', 'CAMISETA', 'MOLETOM', 'CASACO', 'TENIS', 'SAPATO', 'BOTA', 'ACESSORIO', 'JAQUETA'];
const GENDERS  = [{ value: 'MASCULINO', label: 'Masculino' }, { value: 'FEMININO', label: 'Feminino' }, { value: 'UNISSEX', label: 'Unissex' }];
const CONDITIONS = [{ value: 'NOVO', label: 'Novo' }, { value: 'USADO', label: 'Usado' }];
const UNITS = [
  { value: 'KG',       label: 'kg — quilograma' },
  { value: 'G',        label: 'g — grama' },
  { value: 'ML',       label: 'mL — mililitro' },
  { value: 'L',        label: 'L — litro' },
  { value: 'UNIDADES', label: 'Unidades' },
];

const categoryLabel: Record<string, string> = {
  CALCA: 'Calça', CAMISETA: 'Camiseta', MOLETOM: 'Moletom', CASACO: 'Casaco',
  TENIS: 'Tênis', SAPATO: 'Sapato', BOTA: 'Bota', ACESSORIO: 'Acessório', JAQUETA: 'Jaqueta',
};

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (product: ProductResponse) => void;
}

export function NewProductModal({ open, onClose, onCreated }: Props) {
  const { token } = useAuth();
  const toast = useToast();

  const [type, setType] = useState<ProductType>('clothes');
  const [isPending, setIsPending] = useState(false);

  /* Clothes */
  const [clothesForm, setClothesForm] = useState({ name: '', description: '', size: '', category: '', gender: '', condition: '' });
  const [clothesErrors, setClothesErrors] = useState<Partial<Record<keyof typeof clothesForm, string>>>({});

  /* Food */
  const [foodForm, setFoodForm] = useState({ name: '', description: '', batch: '', expirationDate: '', defaultUnit: '' });
  const [foodErrors, setFoodErrors] = useState<Partial<Record<keyof typeof foodForm, string>>>({});

  function resetForms() {
    setClothesForm({ name: '', description: '', size: '', category: '', gender: '', condition: '' });
    setClothesErrors({});
    setFoodForm({ name: '', description: '', batch: '', expirationDate: '', defaultUnit: '' });
    setFoodErrors({});
  }

  function handleClose() {
    resetForms();
    onClose();
  }

  function validateClothes() {
    const e: typeof clothesErrors = {};
    if (!clothesForm.name.trim()) e.name = 'Nome obrigatório';
    if (!clothesForm.condition) e.condition = 'Condição obrigatória';
    setClothesErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateFood() {
    const e: typeof foodErrors = {};
    if (!foodForm.name.trim()) e.name = 'Nome obrigatório';
    if (!foodForm.defaultUnit) e.defaultUnit = 'Unidade padrão obrigatória';
    if (!foodForm.expirationDate) e.expirationDate = 'Data de validade obrigatória';
    setFoodErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (type === 'clothes' && !validateClothes()) return;
    if (type === 'food' && !validateFood()) return;
    setIsPending(true);
    try {
      let created: ProductResponse;
      if (type === 'clothes') {
        const res = await api.post<ProductResponse>('/api/v1/products/clothes', {
          name: clothesForm.name.trim(),
          description: clothesForm.description.trim() || null,
          size: clothesForm.size || null,
          category: clothesForm.category || null,
          gender: clothesForm.gender || null,
          condition: clothesForm.condition,
        }, token);
        created = { ...res, type: 'CLOTHES' };
      } else {
        const res = await api.post<ProductResponse>('/api/v1/products/foods', {
          name: foodForm.name.trim(),
          description: foodForm.description.trim() || null,
          batch: foodForm.batch.trim() || null,
          expirationDate: foodForm.expirationDate,
          defaultUnit: foodForm.defaultUnit,
        }, token);
        created = { ...res, type: 'FOOD' };
      }
      toast.success('Produto criado!', `"${created.name}" foi adicionado com sucesso.`);
      onCreated(created);
      handleClose();
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      const detail = apiErr?.errors?.map((v) => `${v.field}: ${v.message}`).join(' · ');
      toast.error(apiErr?.title ?? 'Erro ao criar produto', detail || apiErr?.message);
    } finally {
      setIsPending(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => { if (!isPending) handleClose(); }}
        aria-hidden="true"
      />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90dvh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
          <div>
            <h2 className="text-base font-bold text-slate-900">Novo produto</h2>
            <p className="text-xs text-slate-500 mt-0.5">Cadastre um novo produto no estoque</p>
          </div>
          <button
            onClick={() => { if (!isPending) handleClose(); }}
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

        {/* Type tabs */}
        <div className="flex gap-1 px-6 pt-5">
          {(['clothes', 'food'] as ProductType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setType(t); resetForms(); }}
              className={[
                'px-4 py-2 text-sm font-semibold rounded-lg transition-colors duration-150',
                type === t
                  ? 'bg-wine-800 text-white'
                  : 'text-slate-600 hover:bg-slate-100',
              ].join(' ')}
            >
              {t === 'clothes' ? 'Roupa' : 'Alimento'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="px-6 py-5 space-y-4">
            {type === 'clothes' ? (
              <>
                <Field label="Nome" required error={clothesErrors.name}>
                  <input type="text" placeholder="Ex: Camiseta branca" disabled={isPending}
                    value={clothesForm.name}
                    onChange={(e) => { setClothesForm((f) => ({ ...f, name: e.target.value })); setClothesErrors((e2) => ({ ...e2, name: undefined })); }}
                    className={inputClass} />
                </Field>
                <Field label="Descrição" error={clothesErrors.description}>
                  <input type="text" placeholder="Opcional" disabled={isPending}
                    value={clothesForm.description}
                    onChange={(e) => setClothesForm((f) => ({ ...f, description: e.target.value }))}
                    className={inputClass} />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Tamanho">
                    <select value={clothesForm.size} onChange={(e) => setClothesForm((f) => ({ ...f, size: e.target.value }))} disabled={isPending} className={inputClass}>
                      <option value="">Nenhum</option>
                      {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </Field>
                  <Field label="Categoria">
                    <select value={clothesForm.category} onChange={(e) => setClothesForm((f) => ({ ...f, category: e.target.value }))} disabled={isPending} className={inputClass}>
                      <option value="">Nenhuma</option>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{categoryLabel[c]}</option>)}
                    </select>
                  </Field>
                  <Field label="Gênero">
                    <select value={clothesForm.gender} onChange={(e) => setClothesForm((f) => ({ ...f, gender: e.target.value }))} disabled={isPending} className={inputClass}>
                      <option value="">Nenhum</option>
                      {GENDERS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Condição" required error={clothesErrors.condition}>
                    <select value={clothesForm.condition}
                      onChange={(e) => { setClothesForm((f) => ({ ...f, condition: e.target.value })); setClothesErrors((e2) => ({ ...e2, condition: undefined })); }}
                      disabled={isPending} className={inputClass}>
                      <option value="">Selecione</option>
                      {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </Field>
                </div>
              </>
            ) : (
              <>
                <Field label="Nome" required error={foodErrors.name}>
                  <input type="text" placeholder="Ex: Arroz 5kg" disabled={isPending}
                    value={foodForm.name}
                    onChange={(e) => { setFoodForm((f) => ({ ...f, name: e.target.value })); setFoodErrors((e2) => ({ ...e2, name: undefined })); }}
                    className={inputClass} />
                </Field>
                <Field label="Descrição">
                  <input type="text" placeholder="Opcional" disabled={isPending}
                    value={foodForm.description}
                    onChange={(e) => setFoodForm((f) => ({ ...f, description: e.target.value }))}
                    className={inputClass} />
                </Field>
                <Field label="Lote">
                  <input type="text" placeholder="Ex: L20250501 (opcional)" disabled={isPending}
                    value={foodForm.batch}
                    onChange={(e) => setFoodForm((f) => ({ ...f, batch: e.target.value }))}
                    className={inputClass} />
                </Field>
                <Field label="Unidade padrão" required error={foodErrors.defaultUnit}>
                  <select
                    value={foodForm.defaultUnit}
                    onChange={(e) => { setFoodForm((f) => ({ ...f, defaultUnit: e.target.value })); setFoodErrors((e2) => ({ ...e2, defaultUnit: undefined })); }}
                    disabled={isPending}
                    className={inputClass}
                  >
                    <option value="">Selecione</option>
                    {UNITS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
                  </select>
                </Field>
                <Field label="Data de validade" required error={foodErrors.expirationDate}>
                  <input type="date" disabled={isPending}
                    value={foodForm.expirationDate}
                    onChange={(e) => { setFoodForm((f) => ({ ...f, expirationDate: e.target.value })); setFoodErrors((e2) => ({ ...e2, expirationDate: undefined })); }}
                    className={inputClass} />
                </Field>
              </>
            )}
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
              ) : 'Criar produto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
