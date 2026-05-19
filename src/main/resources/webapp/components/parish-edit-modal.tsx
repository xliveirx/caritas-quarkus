'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import { api } from '@/services/api';
import { Field, inputClass } from '@/components/ui/field';
import { maskCNPJ, maskCEP, rawDigits } from '@/shared/utils/formatters';
import type { ParishUpdateRequest } from '@/shared/types/parish-update-request';
import type { ParishResponse } from '@/shared/types/parish-response';
import type { ApiErrorResponse } from '@/shared/types/api-error-response';


/* ─── Types ──────────────────────────────────────────────────────── */

interface Props {
  parishId: number | null;
  onClose: () => void;
  onUpdated: (parish: ParishResponse) => void;
}

interface FormState {
  name: string;
  cnpj: string;
  street: string;
  number: string;
  complement: string;
  city: string;
  state: string;
  postalCode: string;
}

/* ─── Modal ──────────────────────────────────────────────────────── */

export function ParishEditModal({ parishId, onClose, onUpdated }: Props) {
  const { token } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState<FormState>({
    name: '', cnpj: '', street: '', number: '',
    complement: '', city: '', state: '', postalCode: '',
  });
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const open = parishId !== null;

  // Fetch parish data when modal opens
  useEffect(() => {
    if (!open || !token || parishId === null) return;

    setIsLoading(true);
    setErrors({});

    api.get<ParishResponse>(`/api/v1/parishes/${parishId}`, token)
      .then((data) => {
        setForm({
          name:       data.name,
          cnpj:       maskCNPJ(data.cnpj),
          street:     data.address.street,
          number:     String(data.address.number),
          complement: data.address.complement ?? '',
          city:       data.address.city,
          state:      data.address.state,
          postalCode: maskCEP(data.address.postalCode),
        });
      })
      .catch((err) => {
        const apiErr = err as ApiErrorResponse;
        toast.error(apiErr?.title ?? 'Erro ao carregar paróquia', apiErr?.message);
        onClose();
      })
      .finally(() => setIsLoading(false));
  }, [parishId, open, token]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && !isPending) onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, isPending, onClose]);

  function set(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validate(): boolean {
    const e: Partial<FormState> = {};
    if (form.cnpj && rawDigits(form.cnpj).length !== 14) e.cnpj = 'CNPJ inválido (14 dígitos)';
    if (form.number && isNaN(Number(form.number.trim()))) e.number = 'Número inválido';
    if (form.state && form.state.trim().length !== 2) e.state = 'Use a sigla do estado (ex: RS)';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate() || !token || parishId === null) return;

    setIsPending(true);
    try {
      const payload: ParishUpdateRequest = {
        name: form.name.trim(),
        cnpj: rawDigits(form.cnpj),
        address: {
          street:     form.street.trim(),
          number:     Number(form.number),
          complement: form.complement.trim() || undefined,
          city:       form.city.trim(),
          state:      form.state.trim().toUpperCase(),
          postalCode: rawDigits(form.postalCode),
        },
      };

      const updated = await api.put<ParishResponse>(`/api/v1/parishes/${parishId}`, payload, token);
      toast.success('Paróquia atualizada!', `"${updated.name}" foi salva com sucesso.`);
      onUpdated(updated);
      onClose();
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      const detail = apiErr?.errors?.map((v) => `${v.field}: ${v.message}`).join(' · ');
      toast.error(
        apiErr?.title ?? 'Erro ao atualizar paróquia',
        detail || apiErr?.message
      );
    } finally {
      setIsPending(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => { if (!isPending) onClose(); }}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90dvh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
          <div>
            <h2 className="text-base font-bold text-slate-900">Editar Paróquia</h2>
            <p className="text-xs text-slate-500 mt-0.5">Atualize os dados da paróquia</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            disabled={isPending}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100
              transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="w-5 h-5">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Loading state */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <svg className="animate-spin w-6 h-6 text-wine-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="px-6 py-5 space-y-4">

              {/* Nome + CNPJ */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Field label="Nome da Paróquia" error={errors.name}>
                    <input
                      type="text" placeholder="Paróquia São João" disabled={isPending}
                      value={form.name} onChange={(e) => set('name', e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                </div>
                <div className="col-span-2">
                  <Field label="CNPJ" error={errors.cnpj}>
                    <input
                      type="text" placeholder="00.000.000/0000-00" disabled={isPending}
                      value={form.cnpj}
                      onChange={(e) => set('cnpj', maskCNPJ(e.target.value))}
                      className={inputClass}
                    />
                  </Field>
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-2 pt-1">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs font-medium text-slate-400">Endereço</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Street + Number */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Field label="Logradouro" error={errors.street}>
                    <input
                      type="text" placeholder="Rua das Flores" disabled={isPending}
                      value={form.street} onChange={(e) => set('street', e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                </div>
                <Field label="Número" error={errors.number}>
                  <input
                    type="text" placeholder="123" disabled={isPending}
                    value={form.number} onChange={(e) => set('number', e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>

              {/* Complement */}
              <Field label="Complemento" error={errors.complement}>
                <input
                  type="text" placeholder="Sala 2, Bloco A (opcional)" disabled={isPending}
                  value={form.complement} onChange={(e) => set('complement', e.target.value)}
                  className={inputClass}
                />
              </Field>

              {/* City + State + CEP */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <Field label="Cidade" error={errors.city}>
                    <input
                      type="text" placeholder="Caxias do Sul" disabled={isPending}
                      value={form.city} onChange={(e) => set('city', e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                </div>
                <Field label="Estado" error={errors.state}>
                  <input
                    type="text" placeholder="RS" maxLength={2} disabled={isPending}
                    value={form.state}
                    onChange={(e) => set('state', e.target.value.toUpperCase())}
                    className={inputClass}
                  />
                </Field>
                <Field label="CEP" error={errors.postalCode}>
                  <input
                    type="text" placeholder="95000-000" disabled={isPending}
                    value={form.postalCode}
                    onChange={(e) => set('postalCode', maskCEP(e.target.value))}
                    className={inputClass}
                  />
                </Field>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
              <button
                type="button" onClick={onClose} disabled={isPending}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800
                  rounded-lg hover:bg-slate-200 transition-colors duration-150
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                type="submit" disabled={isPending}
                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white
                  bg-wine-800 hover:bg-wine-900 rounded-lg
                  transition-colors duration-150
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
                ) : 'Salvar alterações'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
