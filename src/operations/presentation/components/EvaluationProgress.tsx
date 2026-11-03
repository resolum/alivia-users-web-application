import { Check } from 'lucide-react';
import { CONTRACTING_STAGES as STEPS } from '@/subscriptions/index.ts';

/** The evaluation is the third stage of the contracting. */
const CURRENT = 2;
const SUBSTEPS = [
  { id: 'schedule', label: 'Fecha y horario' },
  { id: 'confirm', label: 'Confirmación' },
] as const;

export type EvaluationSubstep = (typeof SUBSTEPS)[number]['id'];

/** Contracting progress at the evaluation stage, with the two parts of the evaluation booking. */
export function EvaluationProgress({ current }: { readonly current: EvaluationSubstep }) {
  const currentIndex = SUBSTEPS.findIndex((step) => step.id === current);
  return (
    <section className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-[0_8px_28px_rgba(15,42,107,0.05)]" aria-label="Progreso de contratación">
      <ol className="flex items-center gap-2">
        {STEPS.map((step, index) => {
          const last = index === STEPS.length - 1;
          const done = index < CURRENT;
          const current = index === CURRENT;
          return (
            <li key={step} className="flex flex-1 items-center gap-2">
              <span className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold ${current ? 'bg-alivia-primary text-white ring-4 ring-alivia-primary-mist' : done ? 'bg-alivia-mint text-alivia-secondary-deep' : 'bg-alivia-primary-mist text-alivia-primary-light'}`}>
                {current ? <span className="size-2 rounded-full bg-white" /> : done ? <Check aria-hidden="true" className="size-3.5" /> : index + 1}
              </span>
              <span className={`hidden whitespace-nowrap text-sm lg:inline ${current ? 'font-extrabold text-alivia-primary' : done ? 'font-semibold text-alivia-text' : 'font-semibold text-slate-400'}`}>{step}</span>
              {!last && <span className={`hidden h-px flex-1 md:block ${done ? 'bg-alivia-secondary-light' : 'bg-slate-200'}`} />}
            </li>
          );
        })}
      </ol>
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-semibold">
        <span className="rounded-md bg-alivia-primary-mist px-2.5 py-1 text-alivia-primary">Evaluación — Paso {CURRENT + 1} de {STEPS.length}</span>
        {SUBSTEPS.map((step, index) => (
          <span key={step.id} aria-current={index === currentIndex ? 'step' : undefined} className={index < currentIndex ? 'text-alivia-secondary-deep' : index === currentIndex ? 'text-alivia-primary' : 'text-slate-400'}>
            <span aria-hidden="true" className="mr-1.5 text-slate-300">•</span>
            {index < currentIndex ? <Check aria-hidden="true" className="mr-1 inline size-3.5 align-[-2px]" /> : null}
            {step.label}
          </span>
        ))}
      </div>
    </section>
  );
}
