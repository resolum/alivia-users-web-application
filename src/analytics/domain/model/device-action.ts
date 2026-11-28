export const METRIC_RANGES = ['today', 'week', 'month'] as const;
export type MetricRange = (typeof METRIC_RANGES)[number];

export const DEVICE_KINDS = ['light', 'door', 'window', 'curtain'] as const;
export type DeviceKind = (typeof DEVICE_KINDS)[number];

/** low_confidence: the voice command was rejected; unconfirmed: sent, but the actuator never answered. */
export const ACTION_RESULTS = ['succeeded', 'failed', 'low_confidence', 'unconfirmed'] as const;
export type ActionResult = (typeof ACTION_RESULTS)[number];

/**
 * One action the assisted person asked for on a device. It carries what was understood,
 * never the captured audio. Backend equivalent: pending (analytics contract).
 */
export interface DeviceAction {
  /** Given by the Edge and kept when it resends the event after a disconnection. */
  readonly eventId: string;
  readonly deviceId: string;
  readonly deviceName: string;
  readonly deviceKind: DeviceKind;
  /** What was understood, e.g. "Encender la luz". */
  readonly intent: string;
  readonly source: 'voice' | 'panel';
  readonly result: ActionResult;
  readonly occurredAt: string;
  /** Run by the Edge while the home had no Internet and synced later. */
  readonly executedLocally: boolean;
}

const RANGE_DAYS: Record<MetricRange, number> = { today: 0, week: 6, month: 29 };

/** Start of the period, counted in whole days back from today. */
export function rangeStart(range: MetricRange, now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - RANGE_DAYS[range]);
}

/** A resent event counts once, whatever the number of syncs. */
export function uniqueActions(actions: readonly DeviceAction[]): DeviceAction[] {
  return [...new Map(actions.map((action) => [action.eventId, action])).values()];
}

export function filterActions(actions: readonly DeviceAction[], range: MetricRange, deviceId: string, now: Date): DeviceAction[] {
  const from = rangeStart(range, now);
  return uniqueActions(actions).filter(
    (action) => new Date(action.occurredAt) >= from && (deviceId === '' || action.deviceId === deviceId),
  );
}

export interface ActionSummary {
  readonly byKind: Record<DeviceKind, { readonly requested: number; readonly executed: number }>;
  readonly byResult: Record<ActionResult, number>;
  readonly local: number;
  readonly total: number;
}

export function summarize(actions: readonly DeviceAction[]): ActionSummary {
  const byKind = { light: { requested: 0, executed: 0 }, door: { requested: 0, executed: 0 }, window: { requested: 0, executed: 0 }, curtain: { requested: 0, executed: 0 } };
  const byResult = { succeeded: 0, failed: 0, low_confidence: 0, unconfirmed: 0 };
  for (const action of actions) {
    byKind[action.deviceKind].requested += 1;
    if (action.result === 'succeeded') byKind[action.deviceKind].executed += 1;
    byResult[action.result] += 1;
  }
  return { byKind, byResult, local: actions.filter((action) => action.executedLocally).length, total: actions.length };
}
