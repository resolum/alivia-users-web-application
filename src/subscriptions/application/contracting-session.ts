import { clearPlanSelection } from '../infrastructure/plan-selection.storage.ts';
import { clearPaymentKeys } from './payment-authorization.store.ts';

/**
 * Drops the contracting this browser was building: the chosen plan with its request and the payment keys.
 * Called when the family signs out, so the next visit to the plans starts from the first step.
 */
export function clearContractingInProgress(): void {
  clearPlanSelection();
  clearPaymentKeys();
}
