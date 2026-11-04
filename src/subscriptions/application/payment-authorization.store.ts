import type { HomeConfiguration } from '../domain/model/home-configuration.ts';
import type { PaymentSetup, Preauthorization } from '../domain/model/payment-authorization.ts';
import { paymentsApi } from '../infrastructure/payments-api.ts';

const SETUP_KEY_PREFIX = 'alivia.payment-setup-key.';
const PREAUTHORIZATION_KEY_PREFIX = 'alivia.preauthorization-key.';

/**
 * React StrictMode mounts payment twice in development. Keep one request per draft in flight so both mounts
 * observe the same Stripe setup instead of racing with the same idempotency key.
 */
const setupsInFlight = new Map<string, Promise<PaymentSetup>>();

/** Forgets the idempotency keys of the payments started in this browser (after signing out). */
export function clearPaymentKeys(): void {
  const keys: string[] = [];
  for (let index = 0; index < window.sessionStorage.length; index += 1) {
    const key = window.sessionStorage.key(index);
    if (key !== null && (key.startsWith(SETUP_KEY_PREFIX) || key.startsWith(PREAUTHORIZATION_KEY_PREFIX))) keys.push(key);
  }
  keys.forEach((key) => window.sessionStorage.removeItem(key));
  setupsInFlight.clear();
}

function stableKey(prefix: string, draftId: string): string {
  const storageKey = `${prefix}${draftId}`;
  const existing = window.sessionStorage.getItem(storageKey);
  if (existing !== null) return existing;
  const created = crypto.randomUUID();
  window.sessionStorage.setItem(storageKey, created);
  return created;
}

export function preparePaymentMethod(draftId: string): Promise<PaymentSetup> {
  const inFlight = setupsInFlight.get(draftId);
  if (inFlight) return inFlight;

  const setup = paymentsApi
    .prepareSetup(draftId, stableKey(SETUP_KEY_PREFIX, draftId))
    .finally(() => setupsInFlight.delete(draftId));
  setupsInFlight.set(draftId, setup);
  return setup;
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
