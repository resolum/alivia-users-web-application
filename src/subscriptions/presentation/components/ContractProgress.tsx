import { ContractingStepper } from '@/shared/presentation/components/contracting-stepper/ContractingStepper.tsx';

/** Contracting progress on the plan selection: the first of the five stages. */
export function ContractProgress() {
  return <ContractingStepper current="plan" />;
}
