import type { BillingPeriod, PlanCode } from './plan.entity.ts';

export const DEVICE_TYPES = ['LIGHT', 'DOOR', 'WINDOW', 'CURTAIN', 'MICROPHONE'] as const;
export type DeviceType = (typeof DEVICE_TYPES)[number];

export interface RoomConfiguration {
  readonly id: string;
  readonly name: string;
  readonly devices: Readonly<Record<DeviceType, number>>;
}

export interface HomeConfigurationProps {
  readonly draftId: string;
  readonly planCode: PlanCode;
  readonly billingPeriod: BillingPeriod;
  readonly rooms: readonly RoomConfiguration[];
  readonly quote: PlanQuote | null;
  readonly updatedAt: string;
}

export interface PlanQuote {
  readonly currency: string;
  readonly rooms: number;
  readonly baseMonthlyAmount: number;
  readonly additionalRoomsMonthlyAmount: number;
  readonly devicesMonthlyAmount: number;
  readonly totalMonthlyAmount: number;
}

/** Preliminary household device configuration for the customized plan. */
export class HomeConfiguration {
  readonly draftId: string;
  readonly planCode: PlanCode;
  readonly billingPeriod: BillingPeriod;
  readonly rooms: readonly RoomConfiguration[];
  readonly quote: PlanQuote | null;
  readonly updatedAt: string;

  constructor(props: HomeConfigurationProps) {
    if (props.draftId.trim() === '') throw new Error('The draft identifier is required');
    this.draftId = props.draftId;
    this.planCode = props.planCode;
    this.billingPeriod = props.billingPeriod;
    this.rooms = props.rooms;
    this.quote = props.quote;
    this.updatedAt = props.updatedAt;
  }

  get totalDevices(): number {
    return this.rooms.reduce(
      (total, room) => total + DEVICE_TYPES.reduce((roomTotal, type) => roomTotal + room.devices[type], 0),
      0,
    );
  }

  updateDevice(roomId: string, type: DeviceType, quantity: number): HomeConfiguration {
    const normalizedQuantity = type === 'MICROPHONE' ? 1 : Math.max(0, Math.min(4, quantity));
    return new HomeConfiguration({
      draftId: this.draftId,
      planCode: this.planCode,
      billingPeriod: this.billingPeriod,
      rooms: this.rooms.map((room) =>
        room.id === roomId
          ? { ...room, devices: { ...room.devices, [type]: normalizedQuantity } }
          : room,
      ),
      quote: this.quote,
      updatedAt: this.updatedAt,
    });
  }
}

export function createDefaultConfiguration(
  draftId = 'local-preview',
  planCode: PlanCode = 'CUSTOM',
  billingPeriod: BillingPeriod = 'MONTHLY',
): HomeConfiguration {
  return new HomeConfiguration({
    draftId,
    planCode,
    billingPeriod,
    rooms: planCode === 'MINIMUM'
      ? [{ id: 'main-bedroom', name: 'Dormitorio principal', devices: { LIGHT: 1, DOOR: 0, WINDOW: 0, CURTAIN: 0, MICROPHONE: 1 } }]
      : [
          { id: 'main-bedroom', name: 'Habitación principal', devices: { LIGHT: 1, DOOR: 0, WINDOW: 0, CURTAIN: 0, MICROPHONE: 1 } },
          { id: 'secondary-bedroom', name: 'Habitación secundaria', devices: { LIGHT: 0, DOOR: 0, WINDOW: 0, CURTAIN: 0, MICROPHONE: 1 } },
        ],
    quote: null,
    updatedAt: new Date().toISOString(),
  });
}
