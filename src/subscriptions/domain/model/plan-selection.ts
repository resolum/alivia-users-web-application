import type { BillingPeriod, PlanCode } from './plan.entity.ts';

export interface PlanSelectionProps {
  readonly draftId: string;
  readonly planCode: PlanCode;
  readonly billingPeriod: BillingPeriod;
  readonly amount: number;
  readonly selectedAt: string;
}

/** Preliminary choice: it is not an active subscription until technical validation. */
export class PlanSelection {
  readonly draftId: string;
  readonly planCode: PlanCode;
  readonly billingPeriod: BillingPeriod;
  readonly amount: number;
  readonly selectedAt: string;

  constructor(props: PlanSelectionProps) {
    if (props.draftId.trim() === '') throw new Error('The configuration draft identifier is required');
    if (props.amount < 0 || !Number.isFinite(props.amount)) {
      throw new Error('The selected plan amount is invalid');
    }
    this.draftId = props.draftId;
    this.planCode = props.planCode;
    this.billingPeriod = props.billingPeriod;
    this.amount = props.amount;
    this.selectedAt = props.selectedAt;
  }
}
