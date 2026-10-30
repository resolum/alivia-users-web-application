import { describe, expect, it } from 'vitest';
import { Device, homeConnection, recentEvents, type DeviceProps } from './device.entity.ts';

const device = (id: string, changes: Partial<DeviceProps> = {}) =>
  new Device({
    id, code: id, name: id, description: '', kind: 'light', roomId: 'r', roomName: 'Sala', placement: null, power: { type: 'wired' },
    online: true, stateLabel: '', connectivity: '', lastSyncAt: '2026-10-30T10:00:00Z', technicianName: '', history: [], ...changes,
  });

describe('remote supervision', () => {
  const now = new Date('2026-10-30T10:05:00Z');

  it('reports the home offline with its last update when the hub stops reporting', () => {
    const home = { rooms: [], devices: [device('a')], hubOnline: true, hubLastContactAt: '2026-10-30T10:00:00Z' };
    expect(homeConnection(home, now)).toEqual({ online: true, lastUpdateAt: '2026-10-30T10:00:00Z' });
    expect(homeConnection({ ...home, hubOnline: false }, now).online).toBe(false);
    expect(homeConnection(home, new Date('2026-10-30T11:00:00Z')).online).toBe(false);
  });

  it('merges every device history newest first, naming the device', () => {
    const events = recentEvents([
      device('a', { history: [{ at: '2026-10-30T08:00:00Z', title: 'Abierta', detail: '', tone: 'info' }] }),
      device('b', { history: [{ at: '2026-10-30T09:00:00Z', title: 'Batería', detail: '', tone: 'warning' }] }),
    ]);
    expect(events.map((event) => [event.deviceName, event.title])).toEqual([
      ['b', 'Batería'],
      ['a', 'Abierta'],
    ]);
  });
});
