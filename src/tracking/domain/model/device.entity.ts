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
  /** Whether the home hub is reaching the platform, and when it last did. */
  readonly hubOnline: boolean;
  readonly hubLastContactAt: string;
}

/** Without news from the home for this long, events may be waiting to sync. */
export const STALE_MINUTES = 15;

export interface HomeConnection {
  readonly online: boolean;
  /** Latest moment anything from the home was received. */
  readonly lastUpdateAt: string | null;
}

export function homeConnection(home: HomeDevices, now: Date = new Date()): HomeConnection {
  const lastUpdateAt = [home.hubLastContactAt, ...home.devices.map((device) => device.lastSyncAt)].sort().at(-1) ?? null;
  const stale = lastUpdateAt === null || now.getTime() - new Date(lastUpdateAt).getTime() > STALE_MINUTES * 60_000;
  const allDown = home.devices.length > 0 && home.devices.every((device) => !device.online);
  return { online: home.hubOnline && !stale && !allDown, lastUpdateAt };
}

export interface HomeEvent extends DeviceEvent {
  readonly deviceId: string;
  readonly deviceName: string;
  readonly roomName: string;
}

/** Actions and alerts of every device, newest first. */
export function recentEvents(devices: readonly Device[], limit = 12): HomeEvent[] {
  return devices
    .flatMap((device) => device.history.map((event) => ({ ...event, deviceId: device.id, deviceName: device.name, roomName: device.roomName })))
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, limit);
}
