import type { PlanCode } from '../domain/model/plan.entity.ts';
import type { Subscription, SubscriptionStatus } from '../domain/model/subscription.entity.ts';
import { getSubscriptionApi } from '../infrastructure/subscription-api.ts';

export const isSubscriptionSample = () => getSubscriptionApi().isSample;

export const loadSubscription = (): Promise<Subscription> => getSubscriptionApi().getCurrent();

export const changeSubscriptionStatus = (subscription: Subscription, status: SubscriptionStatus) =>
  getSubscriptionApi().changeStatus(subscription.id, status);

export function requestPlanChange(subscription: Subscription, planCode: PlanCode): Promise<Subscription> {
  if (!subscription.canChangePlanTo(planCode)) return Promise.reject(new Error('plan_change_not_allowed'));
  return getSubscriptionApi().requestPlanChange(subscription.id, planCode);
}
