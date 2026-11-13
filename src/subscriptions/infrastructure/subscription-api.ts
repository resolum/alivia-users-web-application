import { BaseApi } from '@/shared/infrastructure/base-api.ts';
import { LocalCollection, respond } from '@/shared/infrastructure/local-collection.ts';
import type { PlanCode } from '../domain/model/plan.entity.ts';
import { Subscription, type SubscriptionProps, type SubscriptionStatus } from '../domain/model/subscription.entity.ts';

export interface SubscriptionApi {
  readonly isSample: boolean;
  getCurrent(): Promise<Subscription>;
  changeStatus(id: string, status: SubscriptionStatus): Promise<Subscription>;
  requestPlanChange(id: string, planCode: PlanCode): Promise<Subscription>;
}

interface BackendSubscriptionResource {
  readonly id: string;
  readonly status: string;
  readonly planCode: string;
  readonly planName: string;
  readonly currency: string;
  readonly monthlyAmount: number;
  readonly startedOn: string;
  readonly renewsOn: string;
  readonly rooms: number;
  readonly devices: number;
  readonly paymentMethod: {
    readonly brand: string;
    readonly last4: string;
    readonly holderName: string;
    readonly autoCharge: boolean;
  };
  readonly lastPayment: {
    readonly id: string;
    readonly amount: number;
    readonly paidAt: string;
    readonly status: 'paid' | 'failed';
    readonly receiptUrl?: string | null;
  } | null;
  readonly pendingPlanCode: string | null;
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

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

function toSubscriptionEntity(res: BackendSubscriptionResource): Subscription {
  const statusLower = (res.status ?? '').toLowerCase();
  const status: SubscriptionStatus =
    statusLower === 'suspended' ? 'suspended' : statusLower === 'cancelled' ? 'cancelled' : 'active';

  return new Subscription({
    id: String(res.id),
    status,
    planCode: (res.planCode ?? 'MINIMUM') as PlanCode,
    planName: res.planName ?? (res.planCode === 'CUSTOM' ? 'Plan Personalizado' : 'Plan Base'),
    currency: res.currency ?? 'S/',
    monthlyAmount: Number(res.monthlyAmount ?? 99),
    startedOn: res.startedOn ?? '2024-10-15',
    renewsOn: res.renewsOn ?? '2024-11-15',
    rooms: res.rooms ?? 2,
    devices: res.devices ?? 5,
    paymentMethod: res.paymentMethod ?? {
      brand: 'VISA',
      last4: '4242',
      holderName: 'María Elena Villanueva C.',
      autoCharge: true,
    },
    lastPayment: res.lastPayment
      ? {
          id: res.lastPayment.id,
          amount: Number(res.lastPayment.amount),
          paidAt: res.lastPayment.paidAt,
          status: res.lastPayment.status,
          receiptUrl: res.lastPayment.receiptUrl,
        }
      : null,
    pendingPlanCode: (res.pendingPlanCode as PlanCode | null) ?? null,
  });
}

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

const httpSubscriptionApi: SubscriptionApi = {
  isSample: false,
  getCurrent: async () => {
    try {
      const response = await BaseApi.request(`${API_BASE_URL}/subscriptions/current`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      }, { authenticated: true });

      if (response.ok) {
        const data = (await response.json()) as BackendSubscriptionResource;
        return toSubscriptionEntity(data);
      }
    } catch {
      // fallback to sample data if offline, backend unreachable, or unauthenticated
    }
    return localSubscriptionApi.getCurrent();
  },

  changeStatus: async (id, status) => {
    try {
      const response = await BaseApi.request(`${API_BASE_URL}/subscriptions/${encodeURIComponent(id)}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ status }),
      }, { authenticated: true });

      if (response.ok) {
        const data = (await response.json()) as BackendSubscriptionResource;
        localSubscriptionApi.changeStatus(id, status).catch(() => {});
        return toSubscriptionEntity(data);
      }
    } catch {
      // fallback
    }
    return localSubscriptionApi.changeStatus(id, status);
  },

  requestPlanChange: async (id, planCode) => {
    try {
      const response = await BaseApi.request(`${API_BASE_URL}/subscriptions/${encodeURIComponent(id)}/plan-change`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ planCode }),
      }, { authenticated: true });

      if (response.ok) {
        const data = (await response.json()) as BackendSubscriptionResource;
        localSubscriptionApi.requestPlanChange(id, planCode).catch(() => {});
        return toSubscriptionEntity(data);
      }
    } catch {
      // fallback
    }
    return localSubscriptionApi.requestPlanChange(id, planCode);
  },
};

export function getSubscriptionApi(): SubscriptionApi {
  return httpSubscriptionApi;
}
