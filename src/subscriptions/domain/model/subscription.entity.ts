import type { PlanCode } from './plan.entity.ts';

export type SubscriptionStatus = 'active' | 'suspended' | 'cancelled';

export interface PaymentMethod {
  readonly brand: string;
  readonly last4: string;
  readonly holderName: string;
  readonly autoCharge: boolean;
}

export interface SubscriptionPayment {
  readonly id: string;
  readonly amount: number;
  readonly paidAt: string;
  readonly status: 'paid' | 'failed';
}

export interface SubscriptionProps {
  readonly id: string;
  readonly status: SubscriptionStatus;
  readonly planCode: PlanCode;
  readonly planName: string;
  readonly currency: string;
  readonly monthlyAmount: number;
  /** ISO dates (yyyy-mm-dd). */
  readonly startedOn: string;
  readonly renewsOn: string;
  readonly rooms: number;
  readonly devices: number;
  readonly paymentMethod: PaymentMethod;
  readonly lastPayment: SubscriptionPayment | null;
  /** Plan the household asked to move to on the next renewal. */
  readonly pendingPlanCode: PlanCode | null;
}

/** The household's contract with Alivia. Backend equivalent: Subscription (Pagos y Suscripciones). */
export class Subscription {
  readonly id: string;
  readonly status: SubscriptionStatus;
  readonly planCode: PlanCode;
  readonly planName: string;
  readonly currency: string;
  readonly monthlyAmount: number;
  readonly startedOn: string;
  readonly renewsOn: string;
  readonly rooms: number;
  readonly devices: number;
  readonly paymentMethod: PaymentMethod;
  readonly lastPayment: SubscriptionPayment | null;
  readonly pendingPlanCode: PlanCode | null;

  constructor(props: SubscriptionProps) {
    this.id = props.id;
    this.status = props.status;
    this.planCode = props.planCode;
    this.planName = props.planName;
    this.currency = props.currency;
    this.monthlyAmount = props.monthlyAmount;
    this.startedOn = props.startedOn;
    this.renewsOn = props.renewsOn;
    this.rooms = props.rooms;
    this.devices = props.devices;
    this.paymentMethod = props.paymentMethod;
    this.lastPayment = props.lastPayment;
    this.pendingPlanCode = props.pendingPlanCode;
  }

  /** Only an active subscription is charged on the renewal date. */
  get nextChargeOn(): string | null {
    return this.status === 'active' ? this.renewsOn : null;
  }

  canChangePlanTo(code: PlanCode): boolean {
    return this.status === 'active' && code !== this.planCode && code !== this.pendingPlanCode;
  }
}
