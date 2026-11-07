import { CONTRACTING_STEPS } from '@/shared/presentation/components/contracting-stepper/contracting-steps.ts';

/** Stages of the guided contracting, from choosing a plan to the active service. */
export const CONTRACTING_STAGES = CONTRACTING_STEPS.map((step) => step.label);
