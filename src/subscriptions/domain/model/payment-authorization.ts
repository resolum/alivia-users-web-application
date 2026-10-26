export const PREAUTHORIZATION_STATUSES = [
  'AWAITING_CONFIRMATION',
  'PREAUTHORIZED',
  'PAYMENT_REJECTED',
  'CANCELED',
  'SUCCEEDED',
] as const;

export type PreauthorizationStatus = (typeof PREAUTHORIZATION_STATUSES)[number];

export interface PaymentSetup {
  readonly setupIntentId: string;
  readonly clientSecret: string;
  readonly publishableKey: string;
}

export interface PreauthorizationProps {
  readonly draftId: string;
  readonly status: PreauthorizationStatus;
  readonly stripePaymentIntentId: string;
  readonly clientSecret: string | null;
  readonly captureBefore: string | null;
}

/** A temporary card hold. It is intentionally distinct from a captured payment. */
export class Preauthorization {
  readonly draftId: string;
  readonly status: PreauthorizationStatus;
  readonly stripePaymentIntentId: string;
  readonly clientSecret: string | null;
  readonly captureBefore: string | null;

  constructor(props: PreauthorizationProps) {
    this.draftId = props.draftId;
    this.status = props.status;
    this.stripePaymentIntentId = props.stripePaymentIntentId;
    this.clientSecret = props.clientSecret;
    this.captureBefore = props.captureBefore;
  }

  get isHeld(): boolean {
    return this.status === 'PREAUTHORIZED';
  }

  get needsCustomerAction(): boolean {
    return this.status === 'AWAITING_CONFIRMATION' && this.clientSecret !== null;
  }
}
