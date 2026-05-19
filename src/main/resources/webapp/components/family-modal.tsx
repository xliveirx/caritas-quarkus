'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import { api } from '@/services/api';
import { Field, inputClass } from '@/components/ui/field';
import { maskCPF, maskCEP, rawDigits } from '@/shared/utils/formatters';
import type { FamilyResponse } from '@/shared/types/family-response';
import type { ParishResponse } from '@/shared/types/parish-response';
import type { ApiErrorResponse } from '@/shared/types/api-error-response';
import { SITUATION_LABELS, type Situation } from '@/shared/types/situation';

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 pt-2">
      <div className="flex-1 h-px bg-slate-200" />
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
      <div className="flex-1 h-px bg-slate-200" />
    </div>
  );
}

/* ─── Types ──────────────────────────────────────────────────────── */

interface MemberForm {
  id?: number;
  name: string;
  cpf: string;
  birthDate: string;
  motherName: string;
  responsible: boolean;
}

interface FormState {
  members: MemberForm[];
  monthlyIncome: string;
  bolsaFamilia: boolean;
  situation: string;
  observation: string;
  street: string;
  number: string;
  complement: string;
  city: string;
  state: string;
  postalCode: string;
  parishId: string;
}

type FieldErrors = Partial<Record<string, string>>;

const emptyMember = (): MemberForm => ({
  name: '', cpf: '', birthDate: '', motherName: '', responsible: false,
});

function buildEmptyForm(): FormState {
  return {
    members: [{ ...emptyMember(), responsible: true }],
    monthlyIncome: '',
    bolsaFamilia: false,
    situation: '',
    observation: '',
    street: '', number: '', complement: '', city: '', state: '', postalCode: '',
    parishId: '',
  };
}

function buildEditForm(family: FamilyResponse): FormState {
  return {
    members: family.members.map((m) => ({
      id: m.id,
      name: m.name,
      cpf: m.cpf ? maskCPF(m.cpf) : '',
      birthDate: m.birthDate ?? '',
      motherName: m.motherName ?? '',
      responsible: m.responsible,
    })),
    monthlyIncome: String(family.monthlyIncome ?? ''),
    bolsaFamilia: family.bolsaFamilia,
    situation: family.situation ?? '',
    observation: family.observation ?? '',
    street:      family.address?.street ?? '',
    number:      family.address?.number != null ? String(family.address.number) : '',
    complement:  family.address?.complement ?? '',
    city:        family.address?.city ?? '',
    state:       family.address?.state ?? '',
    postalCode:  family.address?.postalCode ? maskCEP(family.address.postalCode) : '',
    parishId: '',
  };
}

/* ─── Props ──────────────────────────────────────────────────────── */

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: (family: FamilyResponse) => void;
  family?: FamilyResponse;
  parishes?: ParishResponse[];
  isAdmin: boolean;
}

/* ─── Component ──────────────────────────────────────────────────── */

export function FamilyModal({ open, onClose, onSaved, family, parishes, isAdmin }: Props) {
  const isEdit = !!family;
  const { token } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState<FormState>(buildEmptyForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(family ? buildEditForm(family) : buildEmptyForm());
      setErrors({});
    }
  }, [open, family]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && !isPending) onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, isPending, onClose]);

  /* ── Field setters ───────────────────────────────────────────────── */

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => { const n = { ...e }; delete n[key]; return n; });
  }

  function setMember(index: number, patch: Partial<MemberForm>) {
    setForm((f) => {
      const members = f.members.map((m, i) => i === index ? { ...m, ...patch } : m);
      return { ...f, members };
    });
    setErrors((e) => { const n = { ...e }; delete n[`member_${index}`]; return n; });
  }

  function setResponsible(index: number) {
    setForm((f) => ({
      ...f,
      members: f.members.map((m, i) => ({ ...m, responsible: i === index })),
    }));
  }

  function addMember() {
    setForm((f) => ({ ...f, members: [...f.members, emptyMember()] }));
  }

  function removeMember(index: number) {
    setForm((f) => {
      const members = f.members.filter((_, i) => i !== index);
      // If removed member was responsible and there are others, mark first as responsible
      const hasResponsible = members.some((m) => m.responsible);
      return {
        ...f,
        members: hasResponsible ? members : members.map((m, i) => ({ ...m, responsible: i === 0 })),
      };
    });
  }

  /* ── Validation ──────────────────────────────────────────────────── */

  function validate(): boolean {
    const e: FieldErrors = {};

    form.members.forEach((m, i) => {
      if (!isEdit && !m.name.trim()) e[`member_${i}_name`] = 'Nome obrigatório';
      if (m.cpf && rawDigits(m.cpf).length !== 11) e[`member_${i}_cpf`] = 'CPF inválido';
    });

    if (!isEdit) {
      if (form.members.length === 0) e.members = 'Adicione ao menos um membro.';

      const responsibleCount = form.members.filter((m) => m.responsible).length;
      if (responsibleCount !== 1) e.responsible = 'Exatamente um responsável é obrigatório.';

      if (!form.situation) e.situation = 'Situação obrigatória';

      if (form.monthlyIncome !== '' && (isNaN(Number(form.monthlyIncome)) || Number(form.monthlyIncome) < 0)) {
        e.monthlyIncome = 'Renda inválida (mínimo 0)';
      }

      if (form.number.trim() && isNaN(Number(form.number))) e.number = 'Número inválido';
      if (form.state.trim() && form.state.trim().length !== 2) e.state = 'Use a sigla (ex: RS)';

      if (isAdmin && !form.parishId) e.parishId = 'Selecione uma paróquia';
    } else {
      if (form.monthlyIncome && (isNaN(Number(form.monthlyIncome)) || Number(form.monthlyIncome) < 0)) {
        e.monthlyIncome = 'Renda inválida (mínimo 0)';
      }
      if (form.state && form.state.trim().length !== 2) e.state = 'Use a sigla (ex: RS)';
      if (form.number && isNaN(Number(form.number))) e.number = 'Número inválido';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  /* ── Submit ──────────────────────────────────────────────────────── */

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate() || !token) return;
    setIsPending(true);
    try {
      let result: FamilyResponse;

      if (isEdit) {
        const hasAddress =
          form.street.trim() || form.number.trim() || form.city.trim() ||
          form.state.trim() || form.postalCode.trim();

        const payload: Record<string, unknown> = {};

        if (form.monthlyIncome !== '') payload.monthlyIncome = Number(form.monthlyIncome);
        payload.bolsaFamilia = form.bolsaFamilia;
        if (form.situation) payload.situation = form.situation;
        if (form.observation !== '') payload.observation = form.observation;

        if (hasAddress) {
          const addr: Record<string, unknown> = {};
          if (form.street.trim()) addr.street = form.street.trim();
          if (form.number.trim()) addr.number = Number(form.number);
          if (form.complement.trim()) addr.complement = form.complement.trim();
          if (form.city.trim()) addr.city = form.city.trim();
          if (form.state.trim()) addr.state = form.state.trim().toUpperCase();
          if (form.postalCode.trim()) addr.postalCode = rawDigits(form.postalCode);
          payload.address = addr;
        }

        if (form.members.length > 0) {
          payload.members = form.members.map((m) => ({
            ...(m.id !== undefined ? { id: m.id } : {}),
            ...(m.name.trim() ? { name: m.name.trim() } : {}),
            ...(m.cpf ? { cpf: rawDigits(m.cpf) } : {}),
            ...(m.birthDate ? { birthDate: m.birthDate } : {}),
            ...(m.motherName.trim() ? { motherName: m.motherName.trim() } : {}),
            responsible: m.responsible,
          }));
        }

        result = await api.put<FamilyResponse>(`/api/v1/families/${family!.id}`, payload, token);
        toast.success('Família atualizada!', 'Os dados foram salvos com sucesso.');
      } else {
        const hasAddress = form.street.trim() || form.number.trim() || form.city.trim() ||
          form.state.trim() || form.postalCode.trim();

        const payload = {
          members: form.members.map((m) => ({
            name: m.name.trim(),
            ...(m.cpf ? { cpf: rawDigits(m.cpf) } : {}),
            ...(m.birthDate ? { birthDate: m.birthDate } : {}),
            ...(m.motherName.trim() ? { motherName: m.motherName.trim() } : {}),
            responsible: m.responsible,
          })),
          ...(form.monthlyIncome !== '' ? { monthlyIncome: Number(form.monthlyIncome) } : {}),
          bolsaFamilia: form.bolsaFamilia,
          situation: form.situation as Situation,
          observation: form.observation.trim() || undefined,
          ...(hasAddress ? {
            address: {
              ...(form.street.trim() ? { street: form.street.trim() } : {}),
              ...(form.number.trim() ? { number: Number(form.number) } : {}),
              ...(form.complement.trim() ? { complement: form.complement.trim() } : {}),
              ...(form.city.trim() ? { city: form.city.trim() } : {}),
              ...(form.state.trim() ? { state: form.state.trim().toUpperCase() } : {}),
              ...(form.postalCode.trim() ? { postalCode: rawDigits(form.postalCode) } : {}),
            },
          } : {}),
          ...(isAdmin ? { parishId: Number(form.parishId) } : {}),
        };

        result = await api.post<FamilyResponse>('/api/v1/families', payload, token);
        toast.success('Família cadastrada!', 'A família foi adicionada com sucesso.');
      }

      onSaved(result);
      onClose();
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      const detail = apiErr?.errors?.map((v) => `${v.field}: ${v.message}`).join(' · ');
      toast.error(
        apiErr?.title ?? (isEdit ? 'Erro ao atualizar família' : 'Erro ao cadastrar família'),
        detail || apiErr?.message
      );
    } finally {
      setIsPending(false);
    }
  }

  if (!open) return null;

  const SITUATIONS: Situation[] = [
    'RISCO_BAIXO', 'RISCO_MEDIO', 'RISCO_ALTO', 'POBREZA_EXTREMA', 'EMERGENCIA_SOCIAL',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => { if (!isPending) onClose(); }}
        aria-hidden="true"
      />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[92dvh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {isEdit ? 'Editar família' : 'Nova família'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEdit ? 'Atualize os dados da família' : 'Preencha os dados da nova família'}
            </p>
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

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} noValidate className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

            {/* ── Membros ───────────────────────────────────────────── */}
            <SectionDivider label="Membros" />

            {errors.members && (
              <p className="text-xs text-red-600">{errors.members}</p>
            )}
            {errors.responsible && (
              <p className="text-xs text-red-600">{errors.responsible}</p>
            )}

            <div className="space-y-3">
              {form.members.map((member, idx) => (
                <div key={idx}
                  className={[
                    'rounded-xl border p-4 space-y-3',
                    member.responsible
                      ? 'border-wine-200 bg-wine-50/40'
                      : 'border-slate-200 bg-slate-50/40',
                  ].join(' ')}>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Membro {idx + 1}
                    </span>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input
                          type="radio"
                          name="responsible"
                          checked={member.responsible}
                          onChange={() => setResponsible(idx)}
                          disabled={isPending}
                          className="w-3.5 h-3.5 accent-wine-800"
                        />
                        <span className="text-xs font-medium text-slate-600">Responsável</span>
                      </label>
                      {form.members.length > 1 && !member.responsible && (
                        <button
                          type="button"
                          onClick={() => removeMember(idx)}
                          disabled={isPending}
                          aria-label="Remover membro"
                          className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50
                            transition-colors disabled:opacity-50"
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
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Nome" required={!isEdit} error={errors[`member_${idx}_name`]}>
                      <input
                        type="text" placeholder="Nome completo" disabled={isPending}
                        value={member.name}
                        onChange={(e) => setMember(idx, { name: e.target.value })}
                        className={inputClass}
                      />
                    </Field>
                    <Field label="CPF" error={errors[`member_${idx}_cpf`]}>
                      <input
                        type="text" placeholder="000.000.000-00" disabled={isPending}
                        value={member.cpf}
                        onChange={(e) => setMember(idx, { cpf: maskCPF(e.target.value) })}
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Data de nascimento" error={errors[`member_${idx}_birthDate`]}>
                      <input
                        type="date" disabled={isPending}
                        value={member.birthDate}
                        onChange={(e) => setMember(idx, { birthDate: e.target.value })}
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Nome da mãe" error={errors[`member_${idx}_motherName`]}>
                      <input
                        type="text" placeholder="Nome da mãe" disabled={isPending}
                        value={member.motherName}
                        onChange={(e) => setMember(idx, { motherName: e.target.value })}
                        className={inputClass}
                      />
                    </Field>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addMember}
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5
                  text-sm font-medium text-wine-700 border border-wine-200 border-dashed
                  rounded-lg hover:bg-wine-50 transition-colors duration-150
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  className="w-4 h-4">
                  <path d="M5 12h14M12 5v14" />
                </svg>
                Adicionar membro
              </button>
            </div>

            {/* ── Dados financeiros ─────────────────────────────────── */}
            <SectionDivider label="Dados financeiros" />

            <div className="grid grid-cols-2 gap-3">
              <Field label="Renda mensal (R$)" error={errors.monthlyIncome}>
                <input
                  type="number" min="0" step="0.01" placeholder="0,00" disabled={isPending}
                  value={form.monthlyIncome}
                  onChange={(e) => setField('monthlyIncome', e.target.value)}
                  className={inputClass}
                />
              </Field>

              <Field label="Situação" required={!isEdit} error={errors.situation}>
                <select
                  value={form.situation}
                  onChange={(e) => setField('situation', e.target.value)}
                  disabled={isPending}
                  className={inputClass}
                >
                  <option value="">Selecione…</option>
                  {SITUATIONS.map((s) => (
                    <option key={s} value={s}>{SITUATION_LABELS[s]}</option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div
                  onClick={() => !isPending && setField('bolsaFamilia', !form.bolsaFamilia)}
                  className={[
                    'w-10 h-6 rounded-full transition-colors duration-200 cursor-pointer',
                    form.bolsaFamilia ? 'bg-wine-800' : 'bg-slate-300',
                  ].join(' ')}
                >
                  <div className={[
                    'w-4 h-4 bg-white rounded-full shadow mt-1 transition-transform duration-200',
                    form.bolsaFamilia ? 'translate-x-5' : 'translate-x-1',
                  ].join(' ')} />
                </div>
                <span className="text-sm font-medium text-slate-700">Beneficiário do Bolsa Família</span>
              </label>
            </div>

            {/* ── Observação ────────────────────────────────────────── */}
            <Field label="Observação" error={errors.observation}>
              <textarea
                placeholder="Observações adicionais (opcional)"
                disabled={isPending}
                rows={3}
                value={form.observation}
                onChange={(e) => setField('observation', e.target.value)}
                className={inputClass + ' resize-none'}
              />
            </Field>

            {/* ── Endereço ──────────────────────────────────────────── */}
            <SectionDivider label="Endereço" />

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Field label="Logradouro" error={errors.street}>
                  <input
                    type="text" placeholder="Rua das Flores" disabled={isPending}
                    value={form.street} onChange={(e) => setField('street', e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>
              <Field label="Número" error={errors.number}>
                <input
                  type="text" placeholder="123" disabled={isPending}
                  value={form.number} onChange={(e) => setField('number', e.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>

            <Field label="Complemento" error={errors.complement}>
              <input
                type="text" placeholder="Apto 2, Bloco A (opcional)" disabled={isPending}
                value={form.complement} onChange={(e) => setField('complement', e.target.value)}
                className={inputClass}
              />
            </Field>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <Field label="Cidade" error={errors.city}>
                  <input
                    type="text" placeholder="Caxias do Sul" disabled={isPending}
                    value={form.city} onChange={(e) => setField('city', e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>
              <Field label="Estado" error={errors.state}>
                <input
                  type="text" placeholder="RS" maxLength={2} disabled={isPending}
                  value={form.state}
                  onChange={(e) => setField('state', e.target.value.toUpperCase())}
                  className={inputClass}
                />
              </Field>
              <Field label="CEP" error={errors.postalCode}>
                <input
                  type="text" placeholder="95000-000" disabled={isPending}
                  value={form.postalCode}
                  onChange={(e) => setField('postalCode', maskCEP(e.target.value))}
                  className={inputClass}
                />
              </Field>
            </div>

            {/* ── Paróquia (ADMIN create only) ─────────────────────── */}
            {isAdmin && !isEdit && parishes && parishes.length > 0 && (
              <>
                <SectionDivider label="Paróquia" />
                <Field label="Paróquia" required error={errors.parishId}>
                  <select
                    value={form.parishId}
                    onChange={(e) => setField('parishId', e.target.value)}
                    disabled={isPending}
                    className={inputClass}
                  >
                    <option value="">Selecione uma paróquia</option>
                    {parishes.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </Field>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200
            bg-slate-50 rounded-b-2xl shrink-0">
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
                  Salvando...
                </>
              ) : (isEdit ? 'Salvar alterações' : 'Cadastrar família')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
