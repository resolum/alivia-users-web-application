import { BaseApi } from '@/shared/infrastructure/base-api.ts';
import type { PlanCode } from '../domain/model/plan.entity.ts';
import { Subscription, type SubscriptionStatus } from '../domain/model/subscription.entity.ts';

export interface SubscriptionApi {
  readonly isSample: boolean;
  getCurrent(): Promise<Subscription | null>;
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
    monthlyAmount: Number(res.monthlyAmount ?? 0),
    startedOn: res.startedOn,
    renewsOn: res.renewsOn,
    rooms: res.rooms ?? 0,
    devices: res.devices ?? 0,
    paymentMethod: res.paymentMethod ?? {
      brand: 'Stripe',
      last4: '••••',
      holderName: 'Titular de la cuenta',
      autoCharge: false,
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

const httpSubscriptionApi: SubscriptionApi = {
  isSample: false,
  getCurrent: async () => {
    const response = await BaseApi.request(`${API_BASE_URL}/subscriptions/current`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    }, { authenticated: true });

    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      throw new Error(`subscription_load_failed:${response.status}`);
    }
    const data = (await response.json()) as BackendSubscriptionResource;
    return toSubscriptionEntity(data);
  },

  changeStatus: async (id, status) => {
    const response = await BaseApi.request(`${API_BASE_URL}/subscriptions/${encodeURIComponent(id)}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ status }),
    }, { authenticated: true });

    if (!response.ok) {
      throw new Error(`subscription_status_failed:${response.status}`);
    }
    const data = (await response.json()) as BackendSubscriptionResource;
    return toSubscriptionEntity(data);
  },

  requestPlanChange: async (id, planCode) => {
    const response = await BaseApi.request(`${API_BASE_URL}/subscriptions/${encodeURIComponent(id)}/plan-change`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ planCode }),
    }, { authenticated: true });

    if (!response.ok) {
      throw new Error(`subscription_plan_change_failed:${response.status}`);
    }
    const data = (await response.json()) as BackendSubscriptionResource;
    return toSubscriptionEntity(data);
  },
};

export function getSubscriptionApi(): SubscriptionApi {
  return httpSubscriptionApi;
}
