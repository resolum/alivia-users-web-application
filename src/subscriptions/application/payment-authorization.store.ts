import type { HomeConfiguration } from '../domain/model/home-configuration.ts';
import type { PaymentSetup, Preauthorization } from '../domain/model/payment-authorization.ts';
import { paymentsApi } from '../infrastructure/payments-api.ts';

const SETUP_KEY_PREFIX = 'alivia.payment-setup-key.';
const PREAUTHORIZATION_KEY_PREFIX = 'alivia.preauthorization-key.';

function stableKey(prefix: string, draftId: string): string {
  const storageKey = `${prefix}${draftId}`;
  const existing = window.sessionStorage.getItem(storageKey);
  if (existing !== null) return existing;
  const created = crypto.randomUUID();
  window.sessionStorage.setItem(storageKey, created);
  return created;
}

export function preparePaymentMethod(draftId: string): Promise<PaymentSetup> {
  return paymentsApi.prepareSetup(draftId, stableKey(SETUP_KEY_PREFIX, draftId));
}

export function completePaymentMethodSetup(draftId: string): void {
  window.sessionStorage.removeItem(`${SETUP_KEY_PREFIX}${draftId}`);
}

export async function requestPreauthorization(
  configuration: HomeConfiguration,
  paymentMethodId: string,
): Promise<Preauthorization> {
  return paymentsApi.createPreauthorization(
    configuration.draftId,
    stableKey(PREAUTHORIZATION_KEY_PREFIX, configuration.draftId),
    { paymentMethodId },
  );
}

export function refreshPreauthorization(draftId: string): Promise<Preauthorization> {
  return paymentsApi.getPreauthorization(draftId);
}
