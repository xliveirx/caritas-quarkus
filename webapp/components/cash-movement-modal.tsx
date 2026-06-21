'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import { api } from '@/services/api';
import { Field, inputClass } from '@/components/ui/field';
import type { ApiErrorResponse } from '@/shared/types/api-error-response';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  cashRegisterId: number;
}

interface FormState {
  type: 'INCOME' | 'EXPENSE';
  description: string;
  amount: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

export function CashMovementModal({ open, onClose, onSaved, cashRegisterId }: Props) {
  const { token } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState<FormState>({ type: 'INCOME', description: '', amount: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ type: 'INCOME', description: '', amount: '' });
      setErrors({});
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && !isPending) onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, isPending, onClose]);

  function set<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validate(): boolean {
    const e: FormErrors = {};
    if (!form.description.trim()) e.description = 'Descrição obrigatória';
    const parsed = parseFloat(form.amount.replace(',', '.'));
    if (!form.amount.trim()) e.amount = 'Valor obrigatório';
    else if (isNaN(parsed) || parsed <= 0) e.amount = 'Informe um valor válido maior que zero';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate() || !token) return;
    setIsPending(true);
    try {
      await api.post(
        '/api/v1/cash-register',
        {
          type: form.type,
          description: form.description.trim(),
          amount: parseFloat(form.amount.replace(',', '.')),
          cashRegisterId,
        },
        token
      );
      toast.success('Movimentação registrada!', `${form.type === 'INCOME' ? 'Entrada' : 'Saída'} de ${form.amount} registrada com sucesso.`);
      onSaved();
      onClose();
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      const detail = apiErr?.errors?.map((v) => `${v.field}: ${v.message}`).join(' · ');
      toast.error(apiErr?.title ?? 'Erro ao registrar movimentação', detail || apiErr?.message);
    } finally {
      setIsPending(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => { if (!isPending) onClose(); }}
        aria-hidden="true"
      />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
          <div>
            <h2 className="text-base font-bold text-slate-900">Registrar movimentação</h2>
            <p className="text-xs text-slate-500 mt-0.5">Lançamento manual no caixa</p>
          </div>
          <button
            onClick={() => { if (!isPending) onClose(); }}
            aria-label="Fechar"
            disabled={isPending}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100
              transition-colors duration-150 disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="w-5 h-5">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="px-6 py-5 space-y-4">

            {/* Type toggle */}
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-2">Tipo</p>
              <div className="grid grid-cols-2 gap-2">
                {(['INCOME', 'EXPENSE'] as const).map((t) => {
                  const isSelected = form.type === t;
                  const isIncome = t === 'INCOME';
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => set('type', t)}
                      disabled={isPending}
                      className={[
                        'flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-colors duration-150',
                        isSelected
                          ? isIncome
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                            : 'bg-red-50 border-red-300 text-red-600'
                          : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50',
                      ].join(' ')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                        className="w-4 h-4">
                        {isIncome
                          ? <path d="M12 19V5M5 12l7-7 7 7" />
                          : <path d="M12 5v14M5 12l7 7 7-7" />}
                      </svg>
                      {isIncome ? 'Entrada' : 'Saída'}
                    </button>
                  );
                })}
              </div>
            </div>

            <Field label="Descrição" required error={errors.description}>
              <input
                type="text"
                placeholder="Ex: Coleta dominical, pagamento de conta..."
                disabled={isPending}
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="Valor (R$)" required error={errors.amount}>
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0,00"
                disabled={isPending}
                value={form.amount}
                onChange={(e) => set('amount', e.target.value)}
                className={inputClass}
              />
            </Field>

          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
            <button
              type="button"
              onClick={() => { if (!isPending) onClose(); }}
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
                  Registrando...
                </>
              ) : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
