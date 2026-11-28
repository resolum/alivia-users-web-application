import { describe, expect, it } from 'vitest';
import { toDeviceActions } from './analytics-api.ts';

describe('toDeviceActions', () => {
  it('pairs a voice request with its successful actuator result', () => {
    const actions = toDeviceActions([
      { eventId: 'request-1', commandId: 'command-1', type: 'COMMAND_REQUESTED', deviceId: 30, action: 'OFF', occurredAt: '2026-11-28T04:00:00Z' },
      { eventId: 'result-1', commandId: 'command-1', type: 'COMMAND_RESULT', deviceId: 30, action: 'OFF', result: 'SUCCESS', origin: 'LIVE', occurredAt: '2026-11-28T04:00:01Z' },
    ], [{ deviceId: 30, alias: 'Luz ESP32 Farid', type: 'LIGHT' }]);

    expect(actions).toEqual([expect.objectContaining({
      eventId: 'command-1', deviceName: 'Luz ESP32 Farid', deviceKind: 'light', intent: 'Apagar la luz', result: 'succeeded', source: 'voice',
    })]);
  });

  it('maps synchronized curtain commands and counts the command only once', () => {
    const actions = toDeviceActions([
      { eventId: 'request-2', commandId: 'command-2', type: 'COMMAND_REQUESTED', deviceId: 29, action: 'OPEN', origin: 'SYNCED', occurredAt: '2026-11-27T23:53:00Z' },
      { eventId: 'result-2', commandId: 'command-2', type: 'COMMAND_RESULT', deviceId: 29, action: 'OPEN', result: 'SUCCESS', origin: 'SYNCED', occurredAt: '2026-11-27T23:53:01Z' },
    ], [{ deviceId: 29, alias: 'Cortina ESP32 Farid', type: 'CURTAIN' }]);

    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({ deviceKind: 'curtain', intent: 'Abrir la cortina', executedLocally: true });
  });
});
