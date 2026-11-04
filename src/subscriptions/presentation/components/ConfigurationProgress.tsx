import { Check } from 'lucide-react';

import { ContractingStepper } from '@/shared/presentation/components/contracting-stepper/ContractingStepper.tsx';

/** Contracting progress on the configuration (step 4 of 5): plan, account and household are done; Plan links back. */
export function ConfigurationProgress() {
  return (
    <ContractingStepper current="configuration" planHref="/plans">
      <span className="text-alivia-secondary-deep"><Check aria-hidden="true" className="mr-1 inline size-4 align-[-3px]" />Guardado automático</span>
    </ContractingStepper>
  );
}
