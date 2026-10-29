import { describe, expect, it } from 'vitest';
import { createDefaultConfiguration } from './home-configuration.ts';

describe('HomeConfiguration', () => {
  it('updates device quantities without exceeding the allowed range', () => {
    const configuration = createDefaultConfiguration();
    const roomId = configuration.rooms[0]!.id;

    expect(configuration.updateDevice(roomId, 'WINDOW', 8).rooms[0]!.devices.WINDOW).toBe(4);
    expect(configuration.updateDevice(roomId, 'WINDOW', -2).rooms[0]!.devices.WINDOW).toBe(0);
  });

  it('keeps one assistance microphone per room', () => {
    const configuration = createDefaultConfiguration();
    const roomId = configuration.rooms[0]!.id;

    expect(configuration.updateDevice(roomId, 'MICROPHONE', 0).rooms[0]!.devices.MICROPHONE).toBe(1);
  });
});
