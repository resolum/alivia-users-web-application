import { describe, expect, it } from 'vitest';
import { filterActions, summarize, type DeviceAction } from './device-action.ts';

const action = (overrides: Partial<DeviceAction>): DeviceAction => ({
  eventId: 'e1', deviceId: 'd1', deviceName: 'Luz', deviceKind: 'light', intent: 'Encender la luz', source: 'voice',
  result: 'succeeded', occurredAt: '2026-11-21T10:00:00', executedLocally: false, ...overrides,
});

const now = new Date('2026-11-21T18:00:00');

describe('device actions', () => {
  it('counts an event synced twice only once', () => {
    const synced = action({ eventId: 'e9', executedLocally: true });
    const summary = summarize(filterActions([synced, synced, action({})], 'today', '', now));
    expect(summary.total).toBe(2);
    expect(summary.local).toBe(1);
  });

  it('filters by device and period', () => {
    const list = [
      action({ eventId: 'a' }),
      action({ eventId: 'b', deviceId: 'd2', deviceKind: 'door' }),
      action({ eventId: 'c', occurredAt: '2026-11-10T10:00:00' }),
    ];
    expect(filterActions(list, 'today', 'd1', now).map((item) => item.eventId)).toEqual(['a']);
    expect(filterActions(list, 'month', 'd1', now)).toHaveLength(2);
  });

  it('splits requested from executed and classifies results', () => {
    const summary = summarize([
      action({ eventId: 'a' }),
      action({ eventId: 'b', result: 'low_confidence' }),
      action({ eventId: 'c', deviceKind: 'window', result: 'unconfirmed' }),
    ]);
    expect(summary.byKind.light).toEqual({ requested: 2, executed: 1 });
    expect(summary.byKind.window).toEqual({ requested: 1, executed: 0 });
    expect(summary.byResult).toEqual({ succeeded: 1, failed: 0, low_confidence: 1, unconfirmed: 1 });
  });
});
