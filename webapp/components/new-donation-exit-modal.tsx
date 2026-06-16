'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import { api } from '@/services/api';
import { Field, inputClass } from '@/components/ui/field';
import type { DonationExitResponse } from '@/shared/types/donation-exit-response';
import type { FamilyResponse } from '@/shared/types/family-response';
import type { KitResponse } from '@/shared/types/kit-response';
import type { ParishResponse } from '@/shared/types/parish-response';
import type { PaginatedResponse } from '@/shared/types/paginated-response';
import type { ApiErrorResponse } from '@/shared/types/api-error-response';
import type { ProductDetailResponse } from '@/shared/types/product-detail-response';

const UNIT_LABELS: Record<string, string> = {
  KG: 'kg', G: 'g', ML: 'mL', L: 'L', UNIDADES: 'un.',
};

function formatDate(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function KitItemTags({ product }: { product: ProductDetailResponse }) {
  const parts: string[] = [];

  if (product.type === 'CLOTHES') {
    product.attributes.forEach((a) => parts.push(a.label));
  } else if (product.type === 'FOOD') {
    if (product.batch)          parts.push(`Lote ${product.batch}`);
    if (product.expirationDate) parts.push(`Val. ${formatDate(product.expirationDate)}`);
  } else {
    console.error('[KitItemTags] tipo de produto desconhecido:', (product as { type: unknown }).type);
  }

  if (parts.length === 0) return null;

  return (
    <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
      {parts.join(' · ')}
    </p>
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (exit: DonationExitResponse) => void;
}

function getResponsible(family: FamilyResponse): string {
  return family.members.find((m) => m.responsible)?.name ?? `Família #${family.id}`;
}

export function NewDonationExitModal({ open, onClose, onCreated }: Props) {
  const { token, user } = useAuth();
  const toast = useToast();
  const isAdmin = user?.roles.includes('ADMIN') ?? false;

  const [parishId, setParishId]         = useState('');
  const [familyId, setFamilyId]         = useState('');
  const [kitId, setKitId]               = useState('');
  const [quantity, setQuantity]         = useState('');
  const [observation, setObservation]   = useState('');
  const [isPending, setIsPending]       = useState(false);

  const [parishes, setParishes]         = useState<ParishResponse[]>([]);
  const [families, setFamilies]         = useState<FamilyResponse[]>([]);
  const [kits, setKits]                 = useState<KitResponse[]>([]);
  const [loadingParishes, setLoadingParishes] = useState(false);
  const [loadingData, setLoadingData]   = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // For non-admin, load families and kits once on open (parish is fixed by JWT)
  // For admin, only load parishes here; families + kits load when parishId changes
  useEffect(() => {
    if (!open || !token) return;

    if (isAdmin) {
      setLoadingParishes(true);
      api.get<PaginatedResponse<ParishResponse>>('/api/v1/parishes?page=0&size=200', token)
        .then((res) => setParishes(res.data))
        .catch(() => toast.error('Erro ao carregar paróquias', 'Não foi possível carregar as paróquias.'))
        .finally(() => setLoadingParishes(false));
    } else {
      setLoadingData(true);
      Promise.all([
        api.get<PaginatedResponse<FamilyResponse>>('/api/v1/families?page=0&size=200', token),
        api.get<PaginatedResponse<KitResponse>>('/api/v1/kits?page=0&size=200&active=true', token),
      ])
        .then(([fam, kit]) => {
          setFamilies(fam.data);
          setKits(kit.data.filter((k) => k.active));
        })
        .catch(() => toast.error('Erro ao carregar dados', 'Não foi possível carregar os dados necessários.'))
        .finally(() => setLoadingData(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, token, isAdmin]);

  // For admin: re-fetch families and kits when a parish is selected
  useEffect(() => {
    if (!isAdmin || !parishId || !token) return;

    setFamilyId('');
    setKitId('');
    setFamilies([]);
    setKits([]);
    setLoadingData(true);

    Promise.all([
      api.get<PaginatedResponse<FamilyResponse>>(`/api/v1/families?page=0&size=200&parishId=${parishId}`, token),
      api.get<PaginatedResponse<KitResponse>>(`/api/v1/kits?page=0&size=200&active=true&parishId=${parishId}`, token),
    ])
      .then(([fam, kit]) => {
        setFamilies(fam.data);
        setKits(kit.data.filter((k) => k.active));
      })
      .catch(() => toast.error('Erro ao carregar dados', 'Não foi possível carregar os dados da paróquia selecionada.'))
      .finally(() => setLoadingData(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parishId, isAdmin, token]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && !isPending) onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, isPending, onClose]);

  function resetForm() {
    setParishId(''); setFamilyId(''); setKitId('');
    setQuantity(''); setObservation(''); setErrors({});
    setFamilies([]); setKits([]);
  }

  function handleClose() { resetForm(); onClose(); }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (isAdmin && !parishId) e.parishId = 'Selecione uma paróquia ou diocese';
    if (!familyId) e.familyId = 'Selecione uma família';
    if (!kitId)    e.kitId    = 'Selecione uma cesta';
    const qty = Number(quantity);
    if (!quantity || isNaN(qty) || qty <= 0) e.quantity = 'Informe uma quantidade válida';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate() || !token) return;
    setIsPending(true);
    try {
      const created = await api.post<DonationExitResponse>('/api/v1/donations/exits', {
        parishId:    isAdmin ? Number(parishId) : null,
        familyId:    Number(familyId),
        kitId:       Number(kitId),
        quantity:    Number(quantity),
        observation: observation.trim() || null,
      }, token);
      toast.success('Saída registrada!', 'A saída de doação foi registrada com sucesso.');
      onCreated(created);
      handleClose();
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      const detail = apiErr?.errors?.map((v) => `${v.field}: ${v.message}`).join(' · ');
      toast.error(apiErr?.title ?? 'Erro ao registrar saída', detail || apiErr?.message);
    } finally {
      setIsPending(false);
    }
  }

  if (!open) return null;

  const selectedKit = kits.find((k) => String(k.id) === kitId);
  // Admin blocks all fields until a parish is selected
  const blockedByParish = isAdmin && !parishId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => { if (!isPending) handleClose(); }}
        aria-hidden="true"
      />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[92dvh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
          <div>
            <h2 className="text-base font-bold text-slate-900">Registrar saída</h2>
            <p className="text-xs text-slate-500 mt-0.5">Distribuição de cesta básica para uma família</p>
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

            {/* Parish / Diocese — admin only */}
            {isAdmin && (
              <Field label="Paróquia / Diocese" required error={errors.parishId}>
                <select value={parishId}
                  onChange={(e) => { setParishId(e.target.value); setErrors((p) => ({ ...p, parishId: '' })); }}
                  disabled={isPending || loadingParishes}
                  className={[inputClass, errors.parishId ? 'border-red-400 focus:ring-red-500 focus:border-red-500' : ''].join(' ')}>
                  <option value="">{loadingParishes ? 'Carregando...' : 'Selecione uma paróquia ou diocese'}</option>
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

            {/* Family */}
            <Field label="Família" required error={errors.familyId}>
              <select value={familyId}
                onChange={(e) => { setFamilyId(e.target.value); setErrors((p) => ({ ...p, familyId: '' })); }}
                disabled={isPending || loadingData || blockedByParish}
                className={[
                  inputClass,
                  errors.familyId ? 'border-red-400 focus:ring-red-500 focus:border-red-500' : '',
                  blockedByParish ? 'opacity-40 cursor-not-allowed' : '',
                ].join(' ')}>
                <option value="">
                  {blockedByParish ? 'Selecione uma paróquia primeiro' : loadingData ? 'Carregando...' : 'Selecione uma família'}
                </option>
                {families.map((f) => (
                  <option key={f.id} value={f.id}>{getResponsible(f)}</option>
                ))}
              </select>
            </Field>

            {/* Kit */}
            <Field label="Cesta básica" required error={errors.kitId}>
              <select value={kitId}
                onChange={(e) => { setKitId(e.target.value); setErrors((p) => ({ ...p, kitId: '' })); }}
                disabled={isPending || loadingData || blockedByParish}
                className={[
                  inputClass,
                  errors.kitId ? 'border-red-400 focus:ring-red-500 focus:border-red-500' : '',
                  blockedByParish ? 'opacity-40 cursor-not-allowed' : '',
                ].join(' ')}>
                <option value="">
                  {blockedByParish ? 'Selecione uma paróquia primeiro' : loadingData ? 'Carregando...' : 'Selecione uma cesta'}
                </option>
                {kits.map((k) => (
                  <option key={k.id} value={k.id}>{k.name} — {k.parish.name}</option>
                ))}
              </select>
            </Field>

            {/* Kit preview */}
            {selectedKit && selectedKit.items.length > 0 && (
              <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    Composição da cesta
                  </p>
                  <span className="text-[10px] font-semibold text-slate-400">
                    {selectedKit.items.length} {selectedKit.items.length === 1 ? 'item' : 'itens'}
                  </span>
                </div>
                <ul className="divide-y divide-slate-100 bg-white">
                  {selectedKit.items.map((item, index) => (
                    <li key={item.id} className="flex items-start gap-3 px-4 py-3">
                      <span className="text-[10px] font-bold text-slate-300 mt-0.5 w-4 shrink-0 text-right tabular-nums">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 leading-tight">
                          {item.product.name}
                        </p>
                        <KitItemTags product={item.product} />
                      </div>
                      <div className="shrink-0 text-right leading-tight mt-0.5">
                        <span className="text-sm font-bold text-slate-700">{item.quantity}</span>
                        {item.product.defaultUnit && (
                          <span className="text-[10px] text-slate-400 ml-0.5">
                            {UNIT_LABELS[item.product.defaultUnit] ?? item.product.defaultUnit}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Quantity */}
            <Field label="Quantidade de cestas" required error={errors.quantity}>
              <input
                type="number" min={1} step={1} placeholder="Ex: 1"
                disabled={isPending || blockedByParish} value={quantity}
                onChange={(e) => { setQuantity(e.target.value); setErrors((p) => ({ ...p, quantity: '' })); }}
                className={[
                  inputClass,
                  errors.quantity ? 'border-red-400 focus:ring-red-500 focus:border-red-500' : '',
                  blockedByParish ? 'opacity-40 cursor-not-allowed' : '',
                ].join(' ')}
              />
            </Field>

            {/* Observation */}
            <Field label="Observação">
              <textarea
                placeholder="Observação opcional"
                disabled={isPending || blockedByParish} rows={2} value={observation}
                onChange={(e) => setObservation(e.target.value)}
                className={[inputClass + ' resize-none', blockedByParish ? 'opacity-40 cursor-not-allowed' : ''].join(' ')}
              />
            </Field>

          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
            <button type="button" onClick={() => { if (!isPending) handleClose(); }} disabled={isPending}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800
                rounded-lg hover:bg-slate-200 transition-colors duration-150 disabled:opacity-50">
              Cancelar
            </button>
            <button type="submit" disabled={isPending || loadingData || loadingParishes}
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
                  Registrando...
                </>
              ) : 'Registrar saída'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
