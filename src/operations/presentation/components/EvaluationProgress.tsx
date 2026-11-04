import { Check } from 'lucide-react';
import { ContractingStepper } from '@/shared/presentation/components/contracting-stepper/ContractingStepper.tsx';

const SUBSTEPS = [
  { id: 'schedule', label: 'Fecha y horario' },
  { id: 'confirm', label: 'Confirmación' },
] as const;

export type EvaluationSubstep = (typeof SUBSTEPS)[number]['id'];

/** Contracting progress at the evaluation stage, with the two parts of the evaluation booking. */
export function EvaluationProgress({ current }: { readonly current: EvaluationSubstep }) {
  const currentIndex = SUBSTEPS.findIndex((step) => step.id === current);
  return (
    <ContractingStepper current="evaluation" planHref="/plans">
      <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {SUBSTEPS.map((step, index) => (
          <span key={step.id} aria-current={index === currentIndex ? 'step' : undefined} className={index < currentIndex ? 'text-alivia-secondary-deep' : index === currentIndex ? 'text-alivia-primary' : 'text-slate-400'}>
            {index < currentIndex ? <Check aria-hidden="true" className="mr-1 inline size-3.5 align-[-2px]" /> : null}
            {step.label}
          </span>
        ))}
      </span>
    </ContractingStepper>
  );
}
