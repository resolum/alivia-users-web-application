import { afterEach, describe, expect, it, vi } from 'vitest';
import { contractingTrackingApi, TrackingRequestError } from './contracting-tracking-api.ts';

const tracking = {
  draftId: 'd1', code: 'SOL-ABCD1234', stage: 'CONFIRMATION', planCode: 'CUSTOM', planName: 'Plan Personalizado',
  rooms: 3, devices: 6, monthlyAmount: 179, currency: 'PEN', confirmedAt: null, installation: null,
  evaluation: {
    date: '2026-11-03', startTime: '10:00', endTime: '12:00', technicianName: 'Carla Mendoza', directions: null,
    status: 'COMPLETED', result: 'VIABLE_WITH_ADAPTATION', notes: '1 sensor adicional en puerta posterior',
  },
};

function reply(status: number, body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('contractingTrackingApi', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('reads the tracking and confirms the configuration', async () => {
    const fetchMock = reply(200, tracking);
    const read = await contractingTrackingApi.get('d1');
    expect(read.evaluationOutcome).toBe('VIABLE_WITH_ADAPTATION');
    expect(read.formattedMonthlyAmount).toBe('S/ 179');
    expect(read.steps.map((step) => step.state)).toEqual(['done', 'current', 'pending', 'pending']);
    expect(read.steps[1]?.caption).toBe('Requiere revisión');
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/configuration-drafts/d1/tracking', expect.anything());

    const confirmMock = reply(200, { ...tracking, stage: 'INSTALLATION', confirmedAt: '2026-11-03T15:00:00Z' });
    expect((await contractingTrackingApi.confirm('d1')).stage).toBe('INSTALLATION');
    expect(confirmMock).toHaveBeenCalledWith('/api/v1/configuration-drafts/d1/confirmation',
      expect.objectContaining({ method: 'POST' }));
  });

  it('explains why a confirmation is refused and reports network failures', async () => {
    reply(409, { detail: 'not ready' });
    await expect(contractingTrackingApi.confirm('d1')).rejects.toMatchObject({ status: 409, message: expect.stringContaining('técnico') });
    reply(404, {});
    await expect(contractingTrackingApi.get('d1')).rejects.toBeInstanceOf(TrackingRequestError);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    await expect(contractingTrackingApi.get('d1')).rejects.toMatchObject({ status: 0 });
  });

  it('stops a home that is not viable at the evaluation', async () => {
    reply(200, { ...tracking, stage: 'NOT_VIABLE', monthlyAmount: 179.5, currency: 'USD',
      evaluation: { ...tracking.evaluation, result: 'NOT_VIABLE' } });
    const read = await contractingTrackingApi.get('d1');
    expect(read.steps[0]).toEqual({ label: 'Evaluación', state: 'current', caption: 'No viable' });
    expect(read.formattedMonthlyAmount).toBe('USD 179.50');
    reply(200, { ...tracking, stage: 'EVALUATION', monthlyAmount: null,
      evaluation: { ...tracking.evaluation, status: 'SCHEDULED', result: null } });
    const pending = await contractingTrackingApi.get('d1');
    expect(pending.evaluationOutcome).toBeNull();
    expect(pending.formattedMonthlyAmount).toBeNull();
  });
});
