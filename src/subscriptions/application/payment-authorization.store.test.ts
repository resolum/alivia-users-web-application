// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../infrastructure/payments-api.ts', () => ({
  paymentsApi: { prepareSetup: vi.fn() },
}));

import type { PaymentSetup } from '../domain/model/payment-authorization.ts';
import { paymentsApi } from '../infrastructure/payments-api.ts';
import { preparePaymentMethod } from './payment-authorization.store.ts';

describe('preparePaymentMethod', () => {
  afterEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
  });

  it('reuses the request in flight when StrictMode mounts the payment twice', async () => {
    let resolveSetup: (value: PaymentSetup) => void = () => {};
    const pending = new Promise<PaymentSetup>((resolve) => { resolveSetup = resolve; });
    vi.mocked(paymentsApi.prepareSetup).mockReturnValue(pending);

    const first = preparePaymentMethod('draft-1');
    const second = preparePaymentMethod('draft-1');
    const setup = { clientSecret: 'seti_secret', setupIntentId: 'seti_1' } as PaymentSetup;
    resolveSetup(setup);

    await expect(first).resolves.toEqual(setup);
    await expect(second).resolves.toEqual(setup);
    expect(paymentsApi.prepareSetup).toHaveBeenCalledTimes(1);
  });

  it('allows a new attempt after the previous request finishes', async () => {
    const firstSetup = { clientSecret: 'first', setupIntentId: 'seti_1' } as PaymentSetup;
    const secondSetup = { clientSecret: 'second', setupIntentId: 'seti_2' } as PaymentSetup;
    vi.mocked(paymentsApi.prepareSetup)
      .mockResolvedValueOnce(firstSetup)
      .mockResolvedValueOnce(secondSetup);

    await expect(preparePaymentMethod('draft-2')).resolves.toEqual(firstSetup);
    await expect(preparePaymentMethod('draft-2')).resolves.toEqual(secondSetup);
    expect(paymentsApi.prepareSetup).toHaveBeenCalledTimes(2);
  });
});
