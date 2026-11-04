/** Stages of the guided contracting, from choosing a plan to the technical evaluation. After that, the tracking page shows the progress of the request. */
export const CONTRACTING_STEPS = [
  { id: 'plan', label: 'Plan' },
  { id: 'account', label: 'Cuenta' },
  { id: 'household', label: 'Hogar' },
  { id: 'configuration', label: 'Configuración' },
  { id: 'evaluation', label: 'Evaluación' },
] as const;

export type ContractingStepId = (typeof CONTRACTING_STEPS)[number]['id'];
