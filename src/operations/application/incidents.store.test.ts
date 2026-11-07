import { afterEach, describe, expect, it, vi } from 'vitest';
import { ReportIncidentCommand } from '../domain/model/report-incident.command.ts';
import { isIncidentsSample, loadOpenIncidentOf, loadReportForm, reportIncident } from './incidents.store.ts';

const VISIT = { date: '2026-11-05', startTime: '08:00', endTime: '10:00', technicianId: 5, technicianName: 'Elena Vega' };

describe('incidents store', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('offers the installed devices from the backend', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      directions: null, devices: [{ id: 1, alias: 'Hub central', macAddress: 'AA:BB:CC:DD:EE:FF', type: 'HUB' }],
    }), { status: 200 })));
    expect(isIncidentsSample()).toBe(false);
    const form = await loadReportForm();
    expect(form.devices.map((device) => device.id)).toEqual(['AA:BB:CC:DD:EE:FF']);
    expect(form.photoUploadEnabled).toBe(false);
  });

  it('falls back to the sample home devices when the sample data is on', async () => {
    vi.stubEnv('VITE_INCIDENTS_MOCK', 'true');
    expect(isIncidentsSample()).toBe(true);
    const form = await loadReportForm();
    expect(form.photoUploadEnabled).toBe(true);
    expect(form.devices.length).toBeGreaterThan(0);
    expect(form.devices[0]).toHaveProperty('roomName');
  });

  it('does not send an invalid report', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(reportIncident(new ReportIncidentCommand('', '', 'corta', null, VISIT), {
      id: '', code: '', name: '', roomName: '', kind: 'other',
    }, { line: '', district: '', reference: '' })).rejects.toThrow('validation_failed');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('finds the incident still in course for the chosen device', async () => {
    const incident = (id: number, status: string, mac: string) => ({
      id, deviceId: 1, description: 'Falla del dispositivo', status, resolution: null, evidences: [], createdAt: '2026-11-04T10:00:00',
      statusHistory: [{ status: 'OPEN', changedAt: '2026-11-04T15:00:00Z' }], visits: [], code: `INC-2026-000${id}`,
      problemType: 'BATTERY', occurredAt: null, device: { alias: 'Sensor', macAddress: mac, type: 'SENSOR' }, directions: null,
    });
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => Promise.resolve(new Response(JSON.stringify([
      incident(1, 'RESOLVED', 'AA:AA:AA:AA:AA:AA'), incident(2, 'IN_EVALUATION', 'AA:AA:AA:AA:AA:AA'), incident(3, 'OPEN', 'BB:BB:BB:BB:BB:BB'),
    ]), { status: 200 }))));
    expect((await loadOpenIncidentOf('AA:AA:AA:AA:AA:AA'))?.code).toBe('INC-2026-0002');
    expect(await loadOpenIncidentOf('CC:CC:CC:CC:CC:CC')).toBeNull();

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(incident(3, 'OPEN', 'BB:BB:BB:BB:BB:BB')), { status: 200 })));
    expect((await loadOpenIncidentOf('BB:BB:BB:BB:BB:BB', '3'))?.stage).toBe('registered');
  });
});
