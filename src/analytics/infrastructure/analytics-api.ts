import { BaseApi } from '@/shared/infrastructure/base-api.ts';
import { respond } from '@/shared/infrastructure/local-collection.ts';
import type { ActionResult, DeviceAction, DeviceKind } from '../domain/model/device-action.ts';

export interface AnalyticsApi {
  readonly isSample: boolean;
  listActions(): Promise<DeviceAction[]>;
}

interface AssistedPersonResource { readonly id?: number }
interface DeviceResource { readonly deviceId: number; readonly alias?: string; readonly type?: string }
interface HomeStatusResource { readonly devices?: readonly DeviceResource[] }
interface RecentEventResource {
  readonly eventId: string;
  readonly type: string;
  readonly result?: string;
  readonly origin?: string;
  readonly deviceId?: number;
  readonly occurredAt: string;
  readonly commandId?: string;
  readonly action?: string;
  readonly attributes?: Record<string, unknown>;
}
interface RecentEventsResource { readonly items?: readonly RecentEventResource[] }

const DEVICE_KINDS: Record<string, DeviceKind | undefined> = {
  LIGHT: 'light', DOOR: 'door', WINDOW: 'window', CURTAIN: 'curtain',
};
const ACTION_LABELS: Record<string, string> = { ON: 'Encender', OFF: 'Apagar', OPEN: 'Abrir', CLOSE: 'Cerrar' };
const DEVICE_LABELS: Record<DeviceKind, string> = { light: 'la luz', door: 'la puerta', window: 'la ventana', curtain: 'la cortina' };

function resultOf(event: RecentEventResource | undefined): ActionResult {
  switch (event?.result) {
    case 'SUCCESS': return 'succeeded';
    case 'REJECTED_LOW_CONFIDENCE': return 'low_confidence';
    case 'NO_CONFIRMATION': return 'unconfirmed';
    default: return 'failed';
  }
}

/** Converts the event stream into one row per command, pairing request and result by commandId. */
export function toDeviceActions(events: readonly RecentEventResource[], devices: readonly DeviceResource[]): DeviceAction[] {
  const deviceById = new Map(devices.map((device) => [device.deviceId, device]));
  const commandEvents = events.filter((event) =>
    event.type === 'COMMAND_REQUESTED' || event.type === 'COMMAND_RESULT' || event.type === 'COMMAND_REJECTED');
  const groups = new Map<string, RecentEventResource[]>();
  for (const event of commandEvents) {
    const key = event.commandId ?? event.eventId;
    groups.set(key, [...(groups.get(key) ?? []), event]);
  }

  return [...groups.entries()].flatMap(([commandId, group]) => {
    const request = group.find((event) => event.type === 'COMMAND_REQUESTED');
    const outcome = group.find((event) => event.type === 'COMMAND_RESULT' || event.type === 'COMMAND_REJECTED');
    const representative = outcome ?? request;
    if (!representative) return [];
    const deviceId = representative.deviceId ?? request?.deviceId;
    const device = deviceId == null ? undefined : deviceById.get(deviceId);
    const kind = device?.type == null ? undefined : DEVICE_KINDS[device.type.toUpperCase()];
    if (deviceId == null || !device || !kind) return [];
    const action = (representative.action ?? request?.action ?? '').toUpperCase();
    const verb = ACTION_LABELS[action] ?? 'Accionar';
    const source = representative.attributes?.source === 'panel' ? 'panel' : 'voice';
    return [{
      eventId: commandId,
      deviceId: String(deviceId),
      deviceName: device.alias?.trim() || 'Dispositivo',
      deviceKind: kind,
      intent: `${verb} ${DEVICE_LABELS[kind]}`,
      source,
      result: outcome ? resultOf(outcome) : 'unconfirmed',
      occurredAt: request?.occurredAt ?? representative.occurredAt,
      executedLocally: group.some((event) => event.origin === 'SYNCED'),
    } satisfies DeviceAction];
  });
}

const sampleAnalyticsApi: AnalyticsApi = { isSample: true, listActions: () => respond([]) };
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
const PEOPLE_PATH = (import.meta.env.VITE_ASSISTED_PERSONS_ENDPOINT_PATH ?? 'assisted-persons').replace(/^\//, '');
const STATUS_PATH = (import.meta.env.VITE_HOME_DEVICE_STATUS_ENDPOINT_PATH ?? 'devices/status').replace(/^\//, '');

async function getJson<T>(url: string): Promise<T> {
  const response = await BaseApi.request(url, { method: 'GET' }, { authenticated: true });
  if (!response.ok) throw new Error(`No se pudieron cargar las métricas (${response.status}).`);
  return response.json() as Promise<T>;
}

const httpAnalyticsApi: AnalyticsApi = {
  isSample: false,
  listActions: async () => {
    const payload = await getJson<AssistedPersonResource[] | AssistedPersonResource>(`${API_BASE_URL}/${PEOPLE_PATH}`);
    const person = Array.isArray(payload) ? payload[0] : payload;
    if (person?.id == null) return [];
    const root = `${API_BASE_URL}/${PEOPLE_PATH}/${encodeURIComponent(person.id)}`;
    const [status, recent] = await Promise.all([
      getJson<HomeStatusResource>(`${root}/${STATUS_PATH}`),
      getJson<RecentEventsResource>(`${root}/events/recent?limit=100`),
    ]);
    return toDeviceActions(recent.items ?? [], status.devices ?? []);
  },
};

export function getAnalyticsApi(): AnalyticsApi {
  return API_BASE_URL ? httpAnalyticsApi : sampleAnalyticsApi;
}
