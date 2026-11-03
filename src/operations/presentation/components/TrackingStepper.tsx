import { Check } from 'lucide-react';
import type { TrackingStep } from '../../domain/model/contracting-tracking.ts';

/** Evaluación, Confirmación, Instalación and Activación, with the state of each one. */
export function TrackingStepper({ steps, stopped }: { readonly steps: readonly TrackingStep[]; readonly stopped: boolean }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white px-5 py-6 shadow-[0_8px_28px_rgba(15,42,107,0.05)] sm:px-8" aria-label="Etapas de la contratación">
      <ol className="flex items-start">
        {steps.map((step, index) => {
          const last = index === steps.length - 1;
          const done = step.state === 'done';
          const current = step.state === 'current';
          return (
            <li key={step.label} aria-current={current ? 'step' : undefined} className="relative flex flex-1 flex-col items-center text-center">
              {!last && <span aria-hidden="true" className={`absolute top-5 left-1/2 h-0.5 w-full ${done ? 'bg-alivia-secondary-deep' : 'bg-alivia-primary-mist'}`} />}
              <span className={`relative z-10 grid size-10 place-items-center rounded-full text-sm font-bold ${
                done ? 'bg-alivia-secondary-deep text-white'
                  : current ? (stopped ? 'bg-alivia-danger text-white ring-4 ring-red-100' : 'bg-alivia-primary text-white ring-4 ring-alivia-secondary-light')
                    : 'bg-alivia-primary-mist text-alivia-text-soft'}`}>
                {done ? <Check aria-hidden="true" className="size-5" /> : current ? <span className="size-2.5 rounded-full bg-white" /> : index + 1}
              </span>
              <span className={`mt-2 text-xs font-extrabold sm:text-sm ${done ? 'text-alivia-secondary-deep' : current ? 'text-alivia-primary' : 'text-alivia-text-soft'}`}>{step.label}</span>
              <span className={`mt-1 rounded-md px-2 py-0.5 text-[0.7rem] font-bold ${
                current ? (stopped ? 'bg-red-50 text-alivia-danger' : 'bg-alivia-primary-mist text-alivia-primary') : done ? 'text-alivia-text' : 'text-alivia-text-soft'}`}>{step.caption}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
