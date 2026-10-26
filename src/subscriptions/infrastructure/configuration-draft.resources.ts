import type { BillingPeriod, PlanCode } from '../domain/model/plan.entity.ts';

export interface ConfiguredRoomResource {
  readonly key: string;
  readonly name: string;
  readonly lights: number;
  readonly doors: number;
  readonly windows: number;
  readonly curtains: number;
  readonly microphones: number;
}

export interface PlanQuoteResource {
  readonly currency: string;
  readonly rooms: number;
  readonly baseMonthlyAmount: number;
  readonly additionalRoomsMonthlyAmount: number;
  readonly devicesMonthlyAmount: number;
  readonly totalMonthlyAmount: number;
}

export interface ConfigurationDraftResource {
  readonly id: string;
  readonly planCode: PlanCode;
  readonly billingCycle: BillingPeriod;
  readonly rooms: readonly ConfiguredRoomResource[];
  readonly quote: PlanQuoteResource | null;
  readonly updatedAt: string;
}
