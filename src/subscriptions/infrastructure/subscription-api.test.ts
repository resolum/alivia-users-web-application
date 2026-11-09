import { describe, expect, it, vi, afterEach } from 'vitest';
import { getSubscriptionApi } from './subscription-api.ts';
import { BaseApi } from '@/shared/infrastructure/base-api.ts';

describe('Subscription API', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('falls back to local sample subscription when backend request fails', async () => {
    vi.spyOn(BaseApi, 'request').mockRejectedValue(new Error('Network error'));

    const api = getSubscriptionApi();
    const subscription = await api.getCurrent();

    expect(subscription).toBeDefined();
    expect(subscription.planCode).toBe('MINIMUM');
    expect(subscription.status).toBe('active');
    expect(subscription.monthlyAmount).toBe(99);
  });

  it('maps backend response to subscription entity when request succeeds', async () => {
    const mockBackendSubscription = {
      id: '123',
      status: 'active',
      planCode: 'CUSTOM',
      planName: 'Plan Personalizado',
      currency: 'S/',
      monthlyAmount: 159,
      startedOn: '2026-01-01',
      renewsOn: '2026-02-01',
      rooms: 3,
      devices: 7,
      paymentMethod: {
        brand: 'MasterCard',
        last4: '5555',
        holderName: 'Juan Perez',
        autoCharge: true,
      },
      lastPayment: {
        id: 'pay-999',
        amount: 159,
        paidAt: '2026-01-01',
        status: 'paid',
        receiptUrl: 'https://stripe.com/receipt/test',
      },
      pendingPlanCode: null,
    };

    vi.spyOn(BaseApi, 'request').mockResolvedValue(
      new Response(JSON.stringify(mockBackendSubscription), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const api = getSubscriptionApi();
    const subscription = await api.getCurrent();

    expect(subscription.id).toBe('123');
    expect(subscription.planCode).toBe('CUSTOM');
    expect(subscription.planName).toBe('Plan Personalizado');
    expect(subscription.status).toBe('active');
    expect(subscription.monthlyAmount).toBe(159);
    expect(subscription.paymentMethod.brand).toBe('MasterCard');
    expect(subscription.lastPayment?.receiptUrl).toBe('https://stripe.com/receipt/test');
  });

  it('updates subscription status via API', async () => {
    const updatedBackend = {
      id: '123',
      status: 'suspended',
      planCode: 'MINIMUM',
      planName: 'Plan Base',
      currency: 'S/',
      monthlyAmount: 99,
      startedOn: '2026-01-01',
      renewsOn: '2026-02-01',
      rooms: 2,
      devices: 5,
      paymentMethod: {
        brand: 'VISA',
        last4: '4242',
        holderName: 'Maria Elena',
        autoCharge: true,
      },
      lastPayment: null,
      pendingPlanCode: null,
    };

    const requestSpy = vi.spyOn(BaseApi, 'request').mockResolvedValue(
      new Response(JSON.stringify(updatedBackend), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const api = getSubscriptionApi();
    const updated = await api.changeStatus('123', 'suspended');

    expect(requestSpy).toHaveBeenCalled();
    expect(updated.status).toBe('suspended');
  });

  it('requests plan change via API', async () => {
    const updatedBackend = {
      id: '123',
      status: 'active',
      planCode: 'MINIMUM',
      planName: 'Plan Base',
      currency: 'S/',
      monthlyAmount: 99,
      startedOn: '2026-01-01',
      renewsOn: '2026-02-01',
      rooms: 2,
      devices: 5,
      paymentMethod: {
        brand: 'VISA',
        last4: '4242',
        holderName: 'Maria Elena',
        autoCharge: true,
      },
      lastPayment: null,
      pendingPlanCode: 'CUSTOM',
    };

    const requestSpy = vi.spyOn(BaseApi, 'request').mockResolvedValue(
      new Response(JSON.stringify(updatedBackend), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const api = getSubscriptionApi();
    const updated = await api.requestPlanChange('123', 'CUSTOM');

    expect(requestSpy).toHaveBeenCalled();
    expect(updated.pendingPlanCode).toBe('CUSTOM');
  });
});
