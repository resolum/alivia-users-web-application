import { onSignedOut } from '@/iam/index.ts';
import { forgetEvaluationChoice } from '@/operations/index.ts';
import { clearContractingInProgress } from '@/subscriptions/index.ts';

let registered = false;

/**
 * Signing out forgets everything the browser kept of an unfinished contracting (plan, request, chosen visit,
 * payment keys), so "Conoce nuestros planes" starts again at Plan → Cuenta → Hogar instead of jumping ahead.
 */
export function registerSignOutCleanup(): void {
  if (registered) return;
  registered = true;
  onSignedOut(() => {
    clearContractingInProgress();
    forgetEvaluationChoice();
  });
}
