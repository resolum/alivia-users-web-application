import type { PlanCode } from '../domain/model/plan.entity.ts';

export interface PlanResource {
  readonly id: number;
  readonly code: PlanCode;
  readonly name: string;
  readonly description: string;
  readonly status: 'ACTIVE' | 'INACTIVE';
  readonly currency: string;
  readonly billingPeriod: string;
  readonly basePriceAmount: number;
  readonly minimumMonthlyAmount: number;
  readonly priceQualifier: string;
  readonly additionalRoomMonthlyAmount: number | null;
  readonly minimumRooms: number;
  readonly minActuators: number;
  readonly maxActuators: number;
  readonly includedActuators: number;
  readonly deviceMonthlyPrices: Readonly<Record<string, number>>;
  readonly features: readonly string[];
  readonly includedDevices: readonly string[];
}
