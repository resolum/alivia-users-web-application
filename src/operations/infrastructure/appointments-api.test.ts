import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppointmentRequestError, appointmentsApi } from './appointments-api.ts';

const request = {
  draftId: 'd1', date: '2026-10-29', startTime: '10:00', endTime: '12:00', technicianId: 7,
  contactName: 'María', contactPhone: '+51984123456', directions: null,
};

function reply(status: number, body: unknown) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status })));
}

describe('appointmentsApi', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('reads the slots and the booked appointment', async () => {
    reply(200, [{ date: '2026-10-29', startTime: '10:00', endTime: '12:00', technicianId: 7, technicianName: 'Ana', availableTechnicians: 1 }]);
    expect((await appointmentsApi.listAvailableSlots())[0]?.technicianName).toBe('Ana');
    reply(201, { ...request, id: 4, technicianName: 'Ana' });
    expect((await appointmentsApi.schedule(request)).id).toBe(4);
  });

  it('tells apart why a booking was refused', async () => {
    const conflictFor = async (detail: string) => {
      reply(409, { detail });
      return appointmentsApi.schedule(request).catch((error: AppointmentRequestError) => error.conflict);
    };
    expect(await conflictFor('The card must be preauthorized before booking the technical evaluation.')).toBe('NOT_PREAUTHORIZED');
    expect(await conflictFor('This configuration already has a technical evaluation scheduled.')).toBe('ALREADY_SCHEDULED');
    expect(await conflictFor('The selected window is no longer available. Choose another one.')).toBe('SLOT_TAKEN');
  });

  it('reports network failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    await expect(appointmentsApi.listAvailableSlots()).rejects.toMatchObject({ status: 0 });
  });
});
