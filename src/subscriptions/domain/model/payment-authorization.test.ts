import { describe, expect, it } from 'vitest';
import { Preauthorization } from './payment-authorization.ts';

function authorization(status: ConstructorParameters<typeof Preauthorization>[0]['status'], clientSecret: string | null) {
  return new Preauthorization({
    draftId: 'draft-test',
    status,
    stripePaymentIntentId: 'pi_test',
    clientSecret,
    captureBefore: null,
  });
}

describe('Preauthorization', () => {
  it('distinguishes a confirmed hold from a captured payment', () => {
    expect(authorization('PREAUTHORIZED', 'secret').isHeld).toBe(true);
    expect(authorization('SUCCEEDED', null).isHeld).toBe(false);
  });

  it('requests customer action only when Stripe supplies a client secret', () => {
    expect(authorization('AWAITING_CONFIRMATION', 'secret').needsCustomerAction).toBe(true);
    expect(authorization('AWAITING_CONFIRMATION', null).needsCustomerAction).toBe(false);
  });
});
