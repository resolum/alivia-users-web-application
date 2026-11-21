import { respond } from '@/shared/infrastructure/local-collection.ts';
import type { ActionResult, DeviceAction, DeviceKind } from '../domain/model/device-action.ts';

export interface AnalyticsApi {
  readonly isSample: boolean;
  /** Actions of the last 30 days as received, resent events included. */
  listActions(): Promise<DeviceAction[]>;
}

const DEVICES: readonly { id: string; name: string; kind: DeviceKind }[] = [
  { id: 'act-light-bed', name: 'Luz del dormitorio', kind: 'light' },
  { id: 'act-light-hall', name: 'Luz del pasadizo', kind: 'light' },
  { id: 'act-door-main', name: 'Puerta principal', kind: 'door' },
  { id: 'act-window-bed', name: 'Ventana del dormitorio', kind: 'window' },
];

/** [device, intent, source, result, hour]: one day of the sample, rotated so days differ. */
const DAY: readonly [number, string, DeviceAction['source'], ActionResult, number][] = [
  [0, 'Encender la luz', 'voice', 'succeeded', 7],
  [3, 'Abrir la ventana', 'voice', 'succeeded', 8],
  [2, 'Abrir la puerta', 'panel', 'succeeded', 10],
  [1, 'Encender la luz', 'voice', 'low_confidence', 13],
  [3, 'Cerrar la ventana', 'voice', 'unconfirmed', 17],
  [0, 'Apagar la luz', 'voice', 'succeeded', 21],
  [2, 'Cerrar la puerta', 'voice', 'failed', 22],
];

function sample(now: Date): DeviceAction[] {
  const actions = Array.from({ length: 30 }, (_, back) => back).flatMap((back) =>
    DAY.filter((_, index) => (index + back) % 4 !== 0).map(([device, intent, source, result, hour], index) => {
      const at = new Date(now.getFullYear(), now.getMonth(), now.getDate() - back, hour, (index * 7) % 60);
      const { id, name, kind } = DEVICES[device];
      return { eventId: `evt-${back}-${index}`, deviceId: id, deviceName: name, deviceKind: kind, intent, source, result, occurredAt: at.toISOString(), executedLocally: back === 2 && hour < 12 };
    }),
  );
  const past = actions.filter((action) => new Date(action.occurredAt) <= now);
  // The Edge resent the offline batch of two days ago; the duplicates stay to prove they count once.
  return [...past, ...past.filter((action) => action.executedLocally)];
}

/** shortcut: the backend has no analytics endpoint yet; swap in the HTTP source here when it exists. */
const localAnalyticsApi: AnalyticsApi = {
  isSample: true,
  listActions: () => respond(sample(new Date())),
};

export function getAnalyticsApi(): AnalyticsApi {
  return localAnalyticsApi;
}
