import { LocalCollection, respond } from '@/shared/infrastructure/local-collection.ts';
import type { PlanCode } from '../domain/model/plan.entity.ts';
import { Subscription, type SubscriptionProps, type SubscriptionStatus } from '../domain/model/subscription.entity.ts';

export interface SubscriptionApi {
  readonly isSample: boolean;
  getCurrent(): Promise<Subscription>;
  changeStatus(id: string, status: SubscriptionStatus): Promise<Subscription>;
  requestPlanChange(id: string, planCode: PlanCode): Promise<Subscription>;
}

const subscriptions = new LocalCollection<SubscriptionProps>('alivia.subscriptions.current', () => [
  {
    id: 'sub-sample',
    status: 'active',
    planCode: 'MINIMUM',
    planName: 'Plan Base',
    currency: 'S/',
    monthlyAmount: 99,
    startedOn: '2024-10-15',
    renewsOn: '2024-11-15',
    rooms: 2,
    devices: 5,
    paymentMethod: { brand: 'VISA', last4: '4242', holderName: 'María Elena Villanueva C.', autoCharge: true },
    lastPayment: { id: 'pay-2024-10-15', amount: 99, paidAt: '2024-10-15', status: 'paid' },
    pendingPlanCode: null,
  },
]);

function requireSubscription(id: string): SubscriptionProps {
  const found = subscriptions.find(id);
  if (!found) throw new Error('subscription_not_found');
  return found;
}

/**
 * shortcut: the backend exposes plans and the contracting payment, but not the
 * running subscription yet; this one lives in the browser with the Figma example.
 */
const localSubscriptionApi: SubscriptionApi = {
  isSample: true,
  getCurrent: async () => {
    const [current] = await respond(subscriptions.all());
    return new Subscription(current);
  },
  changeStatus: async (id, status) =>
    new Subscription(await respond(subscriptions.save({ ...requireSubscription(id), status }))),
  requestPlanChange: async (id, planCode) =>
    new Subscription(await respond(subscriptions.save({ ...requireSubscription(id), pendingPlanCode: planCode }))),
};

export function getSubscriptionApi(): SubscriptionApi {
  return localSubscriptionApi;
}
