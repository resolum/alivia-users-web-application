import type { BaseEntity } from '@/shared/domain/model/base-entity.ts';

export type DeviceKind = 'microphone' | 'light' | 'window_sensor' | 'door_sensor';

export type DevicePower =
  | { readonly type: 'wired' }
  | { readonly type: 'battery'; readonly level: number; readonly cell: string };

/** operational: working; attention: working but needs action soon; offline: not reporting. */
export type DeviceHealth = 'operational' | 'attention' | 'offline';

export interface DeviceEvent {
  readonly at: string;
  readonly title: string;
  readonly detail: string;
  readonly tone: 'ok' | 'info' | 'warning';
}

export interface DeviceProps {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly description: string;
  readonly kind: DeviceKind;
  readonly roomId: string;
  readonly roomName: string;
  /** Position inside the room ("Ventana Este"), when the installer recorded one. */
  readonly placement: string | null;
  readonly power: DevicePower;
  readonly online: boolean;
  /** Human state reported by the device ("Ventana cerrada"). */
  readonly stateLabel: string;
  readonly connectivity: string;
  readonly lastSyncAt: string;
  readonly technicianName: string;
  readonly history: readonly DeviceEvent[];
}

export const LOW_BATTERY = 20;

/** A device installed in the home. Backend equivalent: Device (Telemetría). */
export class Device implements BaseEntity {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly description: string;
  readonly kind: DeviceKind;
  readonly roomId: string;
  readonly roomName: string;
  readonly placement: string | null;
  readonly power: DevicePower;
  readonly online: boolean;
  readonly stateLabel: string;
  readonly connectivity: string;
  readonly lastSyncAt: string;
  readonly technicianName: string;
  readonly history: readonly DeviceEvent[];

  constructor(props: DeviceProps) {
    this.id = props.id;
    this.code = props.code;
    this.name = props.name;
    this.description = props.description;
    this.kind = props.kind;
    this.roomId = props.roomId;
    this.roomName = props.roomName;
    this.placement = props.placement;
    this.power = props.power;
    this.online = props.online;
    this.stateLabel = props.stateLabel;
    this.connectivity = props.connectivity;
    this.lastSyncAt = props.lastSyncAt;
    this.technicianName = props.technicianName;
    this.history = props.history;
  }

  get batteryLevel(): number | null {
    return this.power.type === 'battery' ? this.power.level : null;
  }

  get hasLowBattery(): boolean {
    const level = this.batteryLevel;
    return level !== null && level < LOW_BATTERY;
  }

  get health(): DeviceHealth {
    if (!this.online) return 'offline';
    return this.hasLowBattery ? 'attention' : 'operational';
  }
}

export interface Room {
  readonly id: string;
  readonly name: string;
  readonly description: string;
}

export interface HomeDevices {
  readonly rooms: readonly Room[];
  readonly devices: readonly Device[];
}
