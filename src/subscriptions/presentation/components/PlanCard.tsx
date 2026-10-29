import { ArrowRight, Check } from 'lucide-react';

import type { BillingPeriod, Plan } from '../../domain/model/plan.entity.ts';

interface PlanCardProps {
  readonly plan: Plan;
  readonly billingPeriod: BillingPeriod;
  readonly pending: boolean;
  readonly selected: boolean;
  readonly onSelect: (plan: Plan) => void;
}

function CheckIcon() {
  return (
    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-alivia-secondary-dark text-xs font-bold text-white" aria-hidden="true"><Check className="size-3.5" strokeWidth={3} /></span>
  );
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('es-PE', { maximumFractionDigits: 0 }).format(amount);
}

export function PlanCard({ plan, billingPeriod, pending, selected, onSelect }: PlanCardProps) {
  const customized = plan.code === 'CUSTOM';
  const amount = plan.priceFor(billingPeriod);
  const periodLabel = billingPeriod === 'ANNUAL' ? '/ año' : '/ mes';

  return (
    <article className={`relative flex h-full flex-col rounded-2xl border bg-white p-6 transition-transform duration-200 hover:-translate-y-1 ${selected ? 'ring-4 ring-alivia-secondary-light' : ''} ${customized ? 'border-alivia-secondary shadow-[0_14px_34px_rgba(15,42,107,0.12)]' : 'border-slate-200 shadow-[0_10px_28px_rgba(15,42,107,0.06)]'}`}>
      {customized && (
        <span className="absolute right-0 top-0 rounded-bl-xl rounded-tr-2xl bg-alivia-secondary px-4 py-2 text-[0.7rem] font-extrabold tracking-wide text-alivia-primary-dark">
          MÁXIMA FLEXIBILIDAD
        </span>
      )}
      <span className={`mb-2 w-fit rounded-full px-3 py-1 text-[0.68rem] font-bold tracking-wide ${customized ? 'bg-alivia-mint text-alivia-secondary-deep' : 'bg-alivia-primary-mist text-alivia-primary-mid'}`}>
        {customized ? 'RECOMENDADO PARA RUTINAS COMPLEJAS' : 'CONFIGURACIÓN PREDEFINIDA'}
      </span>
      <h2 className="text-2xl font-extrabold text-alivia-primary">{plan.name}</h2>
      <p className="mt-1 min-h-12 text-sm leading-6 text-alivia-text-muted">{plan.description}</p>

      <div className="mt-5 rounded-xl bg-[#f1f4ff] px-4 py-4">
        <div className="flex items-end gap-1.5">
          {customized && <span className="mb-1 text-base font-bold text-alivia-primary">Desde</span>}
          <strong className="text-3xl font-extrabold tracking-tight text-alivia-primary">S/ {formatAmount(amount)}</strong>
          <span className="mb-1 text-sm text-alivia-text-muted">{periodLabel}</span>
        </div>
        <p className={`mt-1 text-xs font-semibold ${customized ? 'text-alivia-primary-mid' : 'text-alivia-secondary-deep'}`}>
          {customized ? 'Importe final validado en la evaluación presencial' : 'Precio fijo sin sorpresas'}
        </p>
      </div>

      <ul className="mt-5 flex-1 space-y-3">
        {plan.features.map((feature) => (
          <li key={feature} className="flex gap-2.5 text-sm font-medium leading-5 text-alivia-text">
            <CheckIcon />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => onSelect(plan)}
        disabled={pending || !plan.isAvailable}
        className={`mt-6 min-h-11 w-full rounded-lg px-4 text-sm font-bold text-white transition-colors disabled:cursor-wait disabled:opacity-60 ${customized ? 'bg-alivia-secondary-dark hover:bg-alivia-secondary-deep' : 'bg-alivia-primary hover:bg-alivia-primary-dark'}`}
      >
        {pending
          ? 'Guardando selección…'
          : selected
            ? <><Check aria-hidden="true" className="mr-1 inline size-4 align-[-3px]" />Plan seleccionado</>
            : customized
              ? <>Personalizar plan<ArrowRight aria-hidden="true" className="ml-1.5 inline size-4 align-[-3px]" /></>
              : <>Elegir Plan Base<ArrowRight aria-hidden="true" className="ml-1.5 inline size-4 align-[-3px]" /></>}
      </button>
      <p className="mt-2 text-center text-xs text-slate-400">
        {customized ? 'Ajustable en el siguiente paso' : 'Confirmación inmediata de cobertura'}
      </p>
    </article>
  );
}
