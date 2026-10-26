export const PLAN_CODES = ['MINIMUM', 'CUSTOM'] as const;
export type PlanCode = (typeof PLAN_CODES)[number];

export const BILLING_PERIODS = ['MONTHLY', 'ANNUAL'] as const;
export type BillingPeriod = (typeof BILLING_PERIODS)[number];

export interface PlanProps {
  readonly id: number;
  readonly code: PlanCode;
  readonly name: string;
  readonly description: string;
  readonly status: 'ACTIVE' | 'INACTIVE';
  readonly currency: string;
  readonly basePriceAmount: number;
  readonly minimumMonthlyAmount: number;
  readonly priceQualifier: string;
  readonly features: readonly string[];
  readonly includedDevices: readonly string[];
}

/** Catalog plan exposed by the Subscriptions bounded context. */
export class Plan {
  readonly id: number;
  readonly code: PlanCode;
  readonly name: string;
  readonly description: string;
  readonly status: 'ACTIVE' | 'INACTIVE';
  readonly currency: string;
  readonly basePriceAmount: number;
  readonly minimumMonthlyAmount: number;
  readonly priceQualifier: string;
  readonly features: readonly string[];
  readonly includedDevices: readonly string[];

  constructor(props: PlanProps) {
    this.id = props.id;
    this.code = props.code;
    this.name = props.name;
    this.description = props.description;
    this.status = props.status;
    this.currency = props.currency;
    this.basePriceAmount = props.basePriceAmount;
    this.minimumMonthlyAmount = props.minimumMonthlyAmount;
    this.priceQualifier = props.priceQualifier;
    this.features = props.features;
    this.includedDevices = props.includedDevices;
  }

  get isAvailable(): boolean {
    return this.status === 'ACTIVE';
  }

  priceFor(period: BillingPeriod): number {
    return period === 'ANNUAL'
      ? Math.round(this.minimumMonthlyAmount * 10 * 100) / 100
      : this.minimumMonthlyAmount;
  }
}
