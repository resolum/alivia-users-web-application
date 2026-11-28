import { describe, expect, it } from 'vitest';
import { roomNameOf, toHomeDevices, type HomeStatusResource } from './tracking-api.ts';

describe('toHomeDevices', () => {
  const resource: HomeStatusResource = {
    householdId: 13,
    edgeLink: 'ONLINE',
    lastUpdatedAt: '2026-11-27T15:00:00Z',
    edges: [
      { edgeId: 1, kind: 'MICROPHONE', link: 'UNKNOWN' },
      { edgeId: 2, kind: 'ACTUATOR', link: 'ONLINE', lastReportAt: '2026-11-27T15:00:00Z' },
    ],
    devices: [
      { deviceId: 1, alias: 'Micrófono dormitorio', type: 'MICROPHONE', roomKey: 'habitacion-1', connectionStatus: 'UNKNOWN', stale: false },
      { deviceId: 4, alias: 'Puerta principal', type: 'DOOR', roomKey: 'habitacion-1', connectionStatus: 'CONNECTED', operationalStatus: 'OK',
        currentState: 'OPEN', lastCommunicationAt: '2026-11-27T15:00:00Z', stale: false },
      { deviceId: 5, alias: 'Cortina', type: 'CURTAIN', roomKey: 'main-bedroom', connectionStatus: 'CONNECTED', operationalStatus: 'FAILED',
        batteryPct: 15, faults: ['Servo bloqueado'], lastUpdatedAt: '2026-11-27T14:00:00Z', stale: true },
    ],
  };

  it('groups the devices by room and maps their kind, state and power', () => {
    const home = toHomeDevices(resource);
    expect(home.rooms.map((room) => room.name)).toEqual(['Habitación 1', 'Main bedroom']);
    expect(home.hubOnline).toBe(true);
    const [mic, door, curtain] = home.devices;
    expect(mic).toMatchObject({ code: 'DEV-0001', kind: 'microphone', online: false, stateLabel: 'Aún no reporta', hasReported: false });
    expect(door.hasReported).toBe(true);
    expect(door).toMatchObject({ kind: 'door_sensor', online: true, stateLabel: 'Abierta', roomName: 'Habitación 1' });
    expect(door.power).toEqual({ type: 'wired' });
    expect(curtain).toMatchObject({ kind: 'curtain', online: false, stateLabel: 'Con falla' });
    expect(curtain.batteryLevel).toBe(15);
    expect(curtain.history[0]).toMatchObject({ title: 'Falla reportada', detail: 'Servo bloqueado' });
  });

  it('maps the edges of the home', () => {
    const [voice, actuators] = toHomeDevices(resource).edges ?? [];
    expect(voice).toMatchObject({ id: '1', kind: 'voice', name: 'Edge de control por voz', link: 'unknown', lastReportAt: null });
    expect(actuators).toMatchObject({ kind: 'actuators', link: 'online', lastReportAt: '2026-11-27T15:00:00Z' });
  });

  it('names rooms from their keys', () => {
    expect(roomNameOf('habitacion-3')).toBe('Habitación 3');
    expect(roomNameOf('sala_principal')).toBe('Sala principal');
    expect(roomNameOf('')).toBe('Sin habitación');
  });
});
