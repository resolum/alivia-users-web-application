import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Check } from 'lucide-react';

import { CONTRACTING_STEPS, type ContractingStepId } from './contracting-steps.ts';

interface ContractingStepperProps {
  /** The stage the family is on; earlier stages show as completed. */
  readonly current: ContractingStepId;
  /** Marks the current stage as stopped (for example, a home that is not viable). */
  readonly stopped?: boolean;
  /** Short status shown next to the "Paso N de 5" caption, such as "En proceso". */
  readonly status?: string;
  /** When set, the completed Plan stage links back to the plans page. */
  readonly planHref?: string;
  /** Extra content for the footer row, such as "Guardado automático" or the substeps. */
  readonly children?: ReactNode;
}

/**
 * Progress of the whole contracting journey, shared by the plan, account, household,
 * configuration and evaluation screens so the numbering never changes.
 * On narrow screens only the numbers show; the current stage is named in the caption.
 */
export function ContractingStepper({ current, stopped = false, status, planHref, children }: ContractingStepperProps) {
  const currentIndex = CONTRACTING_STEPS.findIndex((step) => step.id === current);
  const currentStep = CONTRACTING_STEPS[currentIndex];

  return (
    <nav
      aria-label="Progreso de contratación"
      className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-[0_8px_28px_rgba(15,42,107,0.05)] sm:px-5 sm:py-5"
    >
      <ol className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {CONTRACTING_STEPS.map((step, index) => {
          const completed = index < currentIndex;
          const isCurrent = index === currentIndex;
          const bar = completed ? 'bg-alivia-primary' : isCurrent ? (stopped ? 'bg-alivia-danger' : 'bg-alivia-secondary-dark') : 'bg-alivia-primary-mist';
          const text = isCurrent ? (stopped ? 'text-alivia-danger' : 'text-alivia-secondary-deep') : completed ? 'text-alivia-primary' : 'text-slate-400';
          const badge = isCurrent
            ? stopped ? 'bg-alivia-danger text-white ring-4 ring-red-100' : 'bg-alivia-secondary text-alivia-primary-dark ring-4 ring-alivia-secondary-light'
            : completed ? 'bg-alivia-primary text-white' : 'bg-alivia-primary-mist text-alivia-primary-light';
          const content = (
            <>
              <div className={`mb-2 h-1 rounded-full ${bar}`} />
              <div className={`flex flex-col items-start gap-1.5 font-semibold ${text}`}>
                <span className={`grid size-6 shrink-0 place-items-center rounded-full text-[0.65rem] ${badge}`}>
                  {completed ? <Check aria-hidden="true" className="size-3.5" /> : index + 1}
                </span>
                <span className="hidden max-w-full truncate text-[0.7rem] sm:block lg:text-xs">{step.label}</span>
                <span className="sr-only sm:hidden">{step.label}</span>
              </div>
            </>
          );
          return (
            <li key={step.id} className="min-w-0" aria-current={isCurrent ? 'step' : undefined}>
              {completed && step.id === 'plan' && planHref ? (
                <Link to={planHref} title="Volver a elegir plan" className="block rounded-md hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-alivia-primary">
                  {content}
                </Link>
              ) : content}
            </li>
          );
        })}
      </ol>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-slate-100 pt-3 text-xs font-semibold">
        <span className={stopped ? 'text-alivia-danger' : 'text-alivia-primary'}>
          {currentStep.label} · Paso {currentIndex + 1} de {CONTRACTING_STEPS.length}
          {status ? <span className="font-medium text-alivia-text-muted"> · {status}</span> : null}
        </span>
        {children}
      </div>
    </nav>
  );
}
