import type { BillingPeriod, Plan, PlanCode } from '../domain/model/plan.entity.ts';
import { PlanSelection } from '../domain/model/plan-selection.ts';
import { createDefaultConfiguration } from '../domain/model/home-configuration.ts';
import { getPlansApi } from '../infrastructure/plans-api.ts';
import { savePlanSelection } from '../infrastructure/plan-selection.storage.ts';
import { getConfigurationDraftsApi } from '../infrastructure/configuration-drafts-api.ts';

export async function loadActivePlans(): Promise<readonly Plan[]> {
  const plans = await getPlansApi().getActivePlans();
  return plans.filter((plan) => plan.isAvailable);
}

export async function selectPreliminaryPlan(
  planCode: PlanCode,
  billingPeriod: BillingPeriod,
): Promise<PlanSelection> {
  const plans = await loadActivePlans();
  const plan = plans.find((candidate) => candidate.code === planCode);
  if (plan === undefined) throw new Error('PLAN_UNAVAILABLE');
  const draftsApi = getConfigurationDraftsApi();
  let draft = await draftsApi.createDraft(planCode, billingPeriod);
  if (draft.rooms.length === 0) {
    const defaults = createDefaultConfiguration(draft.draftId, planCode, billingPeriod);
    draft = await draftsApi.replaceRooms(draft.draftId, defaults.rooms);
  }
  const selection = new PlanSelection({
    draftId: draft.draftId,
    planCode,
    billingPeriod,
    amount: plan.priceFor(billingPeriod),
    selectedAt: new Date().toISOString(),
  });
  savePlanSelection(selection);
  return selection;
}
