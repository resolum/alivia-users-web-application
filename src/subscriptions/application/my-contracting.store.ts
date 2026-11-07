import { MyContracting } from '../domain/model/my-contracting.ts';
import { PlanSelection } from '../domain/model/plan-selection.ts';
import type { BillingPeriod, PlanCode } from '../domain/model/plan.entity.ts';
import { myContractingApi } from '../infrastructure/my-contracting-api.ts';
import { clearPlanSelection, readPlanSelection, savePlanSelection } from '../infrastructure/plan-selection.storage.ts';

/**
 * The signed-in family's request. A request built in this browser before signing in is linked to the account
 * first, so the family keeps it; a request linked elsewhere is restored here so tracking can open it.
 */
export async function loadMyContracting(): Promise<MyContracting | null> {
  const local = readPlanSelection();
  if (local !== null) {
    // Another account's request, or one that no longer exists, stays out of this account.
    await myContractingApi.claim(local.draftId).catch(() => null);
  }
  const mine = await myContractingApi.mine();
  if (mine?.pendingPath === null) {
    // The claim above has already associated the request with the account, so
    // the preliminary browser draft is no longer needed.
    clearPlanSelection();
  } else if (mine !== null && local?.draftId !== mine.draftId) {
    savePlanSelection(new PlanSelection({
      draftId: mine.draftId,
      planCode: mine.planCode as PlanCode,
      billingPeriod: mine.billingCycle as BillingPeriod,
      amount: 0,
      selectedAt: new Date().toISOString(),
    }));
  }
  return mine;
}
