import type { PreauthorizationStatus } from '../domain/model/payment-authorization.ts';

export interface PaymentSetupResource {
  readonly setupIntentId: string;
  readonly clientSecret: string;
  readonly publishableKey: string;
}

export interface PreauthorizationResource {
  readonly draftId: string;
  readonly status: PreauthorizationStatus;
  readonly stripePaymentIntentId: string;
  readonly clientSecret: string | null;
  readonly captureBefore: string | null;
}

export interface CreatePreauthorizationRequest {
  readonly paymentMethodId: string;
}
