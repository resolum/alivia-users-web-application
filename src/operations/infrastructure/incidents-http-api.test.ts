import { afterEach, describe, expect, it, vi } from 'vitest';
import { ReportIncidentCommand } from '../domain/model/report-incident.command.ts';
import { getIncidentsApi, IncidentNotFoundError } from './incidents-api.ts';
import { addressOf, deviceKindOf, incidentsHttpApi, IncidentsRequestError, toIncident, type IncidentDto } from './incidents-http-api.ts';

const scheduled: IncidentDto = {
  id: 84, deviceId: 2, description: 'El sensor no detecta la ventana desde anoche.', status: 'SCHEDULED', resolution: null,
  evidences: [], createdAt: '2026-11-04T09:30:00',
  statusHistory: [
    { status: 'OPEN', changedAt: '2026-11-04T14:30:00Z' },
    { status: 'IN_EVALUATION', changedAt: '2026-11-04T14:30:01Z' },
    { status: 'SCHEDULED', changedAt: '2026-11-04T14:30:02Z' },
  ],
  visits: [{ orderId: 9, scheduledDate: '2026-11-05', startTime: '10:00:00', endTime: '12:00', technicianName: 'Elena Vega', status: 'SCHEDULED' }],
  code: 'INC-2026-0084', problemType: 'BATTERY', occurredAt: '2026-11-04T13:00:00Z',
  device: { alias: 'Sensor de ventana', macAddress: '00:1A:2B:3C:4D:5E', type: 'SENSOR' },
  directions: 'Av. Del Parque Norte 742, Dpto 401, San Borja',
};

const resolved: IncidentDto = {
  ...scheduled, id: 85, status: 'RESOLVED', resolution: 'Se cambió la batería.', code: null, problemType: 'WEIRD', occurredAt: null, device: null, directions: null,
  statusHistory: [...scheduled.statusHistory, { status: 'IN_PROGRESS', changedAt: '2026-11-05T15:10:00Z' }, { status: 'RESOLVED', changedAt: '2026-11-05T16:00:00Z' }],
  visits: [],
  evidences: [
    { url: 'https://res.cloudinary.com/x/reporte%201.jpg', attachedAt: '2026-11-04T14:31:00Z' },
    { url: 'https://res.cloudinary.com/x/cierre.jpg', attachedAt: '2026-11-05T16:00:00Z' },
  ],
};

const PHOTO = { name: 'sensor.png', type: 'image/png', size: 3, dataUrl: 'data:image/png;base64,AQID' };
const DEVICE = { id: 'm', code: 'DEV-0001', name: 'x', roomName: 'y', kind: 'other' as const };
const NO_ADDRESS = { line: '', district: '', reference: '' };

function reply(status: number, body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const VISIT = { date: '2026-11-05', startTime: '08:00', endTime: '10:00', technicianId: 5, technicianName: 'Elena Vega' };

describe('incidents over HTTP', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('maps every backend status to its stage with the time it was reached', () => {
    const incident = toIncident(scheduled);
    expect(incident.stage).toBe('visit_scheduled');
    expect(incident.code).toBe('INC-2026-0084');
    expect(incident.problemType).toBe('battery');
    expect(incident.deviceName).toBe('Sensor de ventana');
    expect(incident.deviceCode).toBe('DEV-0002');
    expect(incident.deviceKind).toBe('window_sensor');
    expect(incident.roomName).toBe('Sensor');
    expect(incident.stageDates).toEqual({
      registered: '2026-11-04T14:30:00Z', evaluating: '2026-11-04T14:30:01Z', visit_scheduled: '2026-11-04T14:30:02Z',
    });
    expect(incident.visit).toMatchObject({ start: '2026-11-05T15:00:00.000Z', end: '2026-11-05T17:00:00.000Z', technicianName: 'Elena Vega' });
    expect(incident.canRescheduleVisit).toBe(false);
    expect(incident.remoteNote).toBeNull();
    expect(incident.address).toEqual({ line: 'Av. Del Parque Norte 742, Dpto 401', district: 'San Borja', reference: '' });
    expect(incident.reportedAt).toBe('2026-11-04T13:00:00Z');
  });

  it('closes a resolved incident with its resolution and the photos of each moment', () => {
    const incident = toIncident(resolved);
    expect(incident.isResolved).toBe(true);
    expect(incident.code).toBe('INC-85');
    expect(incident.problemType).toBe('other');
    expect(incident.deviceKind).toBe('other');
    expect(incident.deviceName).toBe('Dispositivo 2');
    expect(incident.resolutionNote).toBe('Se cambió la batería.');
    expect(incident.stageDates.in_attention).toBe('2026-11-05T15:10:00Z');
    expect(incident.visit).toBeNull();
    expect(incident.remoteNote).toBe('Sin visita programada');
    expect(incident.evidence.map((item) => [item.name, item.stage])).toEqual([['reporte 1.jpg', 'report'], ['cierre.jpg', 'resolution']]);
    expect(incident.reportedAt).toBe('2026-11-04T14:30:00Z');

    const attending = toIncident({ ...scheduled, status: 'IN_PROGRESS' });
    expect(attending.stage).toBe('in_attention');
    expect(attending.attentionNote).toContain('técnico');
    expect(toIncident({ ...scheduled, status: 'OPEN', statusHistory: [], occurredAt: null }).reportedAt).toBe('2026-11-04T09:30:00');
  });

  it('names the device kind and the address the way the family reads them', () => {
    expect(deviceKindOf({ alias: 'Micrófono sala', type: 'MICROPHONE' })).toBe('microphone');
    expect(deviceKindOf({ alias: 'Luz', type: 'ACTUATOR' })).toBe('light');
    expect(deviceKindOf({ alias: 'Sensor puerta principal', type: 'SENSOR' })).toBe('door_sensor');
    expect(deviceKindOf({ alias: 'Hub', type: 'HUB' })).toBe('other');
    expect(addressOf(null).line).toBe('Dirección registrada en la instalación');
    expect(addressOf('Jr. Lima 120')).toEqual({ line: 'Jr. Lima 120', district: 'Lima', reference: '' });
    expect(toIncident({ ...scheduled, device: { ...scheduled.device!, type: 'ROBOT' } }).roomName).toBe('Dispositivo');
  });

  it('lists the newest incidents first and reads one by id', async () => {
    const fetchMock = reply(200, [scheduled, { ...scheduled, id: 90, occurredAt: '2026-11-04T18:00:00Z' }]);
    expect((await incidentsHttpApi.list()).map((item) => item.id)).toEqual(['90', '84']);
    expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/support-incidents$/), expect.anything());

    reply(200, scheduled);
    expect((await incidentsHttpApi.get('84')).id).toBe('84');
  });

  it('offers the installed devices of the home by their MAC address', async () => {
    reply(200, {
      directions: 'Av. Del Parque Norte 742', photoUploadEnabled: true,
      devices: [{ id: 1, alias: 'Micrófono sala', macAddress: '00:1A:2B:3C:4D:5F', type: 'MICROPHONE' }],
    });
    expect(await incidentsHttpApi.reportForm()).toEqual({
      photoUploadEnabled: true,
      devices: [{ id: '00:1A:2B:3C:4D:5F', code: 'DEV-0001', name: 'Micrófono sala', roomName: 'Micrófono', kind: 'microphone' }],
    });

    reply(200, { directions: null, devices: [] });
    expect((await incidentsHttpApi.reportForm()).photoUploadEnabled).toBe(false);

    reply(404, { detail: 'No active home' });
    expect(await incidentsHttpApi.reportForm()).toEqual({ devices: [], photoUploadEnabled: false });

    reply(500, {});
    await expect(incidentsHttpApi.reportForm()).rejects.toMatchObject({ status: 500, message: 'No pudimos completar la solicitud.' });
  });

  it('reports the failure with the backend names and returns it in evaluation', async () => {
    const fetchMock = reply(201, { ...scheduled, status: 'IN_EVALUATION', visits: [] });
    const command = new ReportIncidentCommand('00:1A:2B:3C:4D:5E', 'no_response', '  No responde a la voz desde ayer.  ', null, VISIT);

    const incident = await incidentsHttpApi.report(command);

    expect(incident.stage).toBe('evaluating');
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/\/support-incidents\/reports$/);
    expect(init.method).toBe('POST');
    expect(JSON.parse(String(init.body))).toMatchObject({
      deviceMac: '00:1A:2B:3C:4D:5E', problemType: 'NO_RESPONSE', description: 'No responde a la voz desde ayer.',
      visitDate: '2026-11-05', visitStartTime: '08:00', visitEndTime: '10:00', technicianId: 5,
    });
    await expect(incidentsHttpApi.report(new ReportIncidentCommand('x', '', 'descripción larga', null, VISIT))).rejects.toBeInstanceOf(IncidentsRequestError);
  });

  it('sends the report without the optional photo, so no storage keys are needed', async () => {
    const fetchMock = reply(201, { ...scheduled, status: 'IN_EVALUATION', visits: [] });
    const photo = { name: 'sensor.jpg', type: 'image/jpeg', size: 120_000, dataUrl: 'data:image/jpeg;base64,AAAA' };
    const command = new ReportIncidentCommand('00:1A:2B:3C:4D:5E', 'battery', 'La batería marca alerta baja.', photo, VISIT);

    expect(command.validate()).toEqual({});
    expect((await incidentsHttpApi.report(command)).stage).toBe('evaluating');
    const body = JSON.parse(String((fetchMock.mock.calls[0] as [string, RequestInit])[1].body)) as Record<string, unknown>;
    expect(Object.keys(body).sort()).toEqual([
      'description', 'deviceMac', 'occurredAt', 'problemType', 'technicianId', 'visitDate', 'visitEndTime', 'visitStartTime',
    ]);
  });

  it('uploads the optional photo as a file right after the report', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ ...scheduled, status: 'IN_EVALUATION' }), { status: 201 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        ...scheduled, status: 'IN_EVALUATION', evidences: [{ url: 'https://res.cloudinary.com/x/sensor.png', attachedAt: '2026-11-04T14:30:05Z' }],
      }), { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);

    const outcome = await getIncidentsApi().reportIncident(
      new ReportIncidentCommand('00:1A:2B:3C:4D:5E', 'battery', 'La batería marca alerta baja.', PHOTO, VISIT), DEVICE, NO_ADDRESS,
    );

    expect(outcome.photoAttached).toBe(true);
    expect(outcome.incident.evidence[0]?.url).toBe('https://res.cloudinary.com/x/sensor.png');
    const [url, init] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(url).toMatch(/\/support-incidents\/84\/evidences\/photo$/);
    const file = (init.body as FormData).get('file') as File;
    expect(file.name).toBe('sensor.png');
    expect(file.type).toBe('image/png');
    expect(new Uint8Array(await file.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));
  });

  it('keeps the report registered when the photo cannot be stored', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ ...scheduled, status: 'IN_EVALUATION' }), { status: 201 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ code: 'photo_upload_unavailable' }), { status: 503 })));

    const outcome = await getIncidentsApi().reportIncident(
      new ReportIncidentCommand('00:1A:2B:3C:4D:5E', 'battery', 'La batería marca alerta baja.', PHOTO, VISIT), DEVICE, NO_ADDRESS,
    );

    expect(outcome.photoAttached).toBe(false);
    expect(outcome.incident.code).toBe('INC-2026-0084');
  });

  it('keeps the chosen visit as requested until the technician confirms it', () => {
    const registered = toIncident({ ...scheduled, status: 'OPEN', statusHistory: [scheduled.statusHistory[0]!] });
    expect(registered.stage).toBe('registered');
    expect(registered.visit?.technicianName).toBe('Elena Vega');
    expect(registered.remoteNote).toMatch(/^Visita solicitada: .*jueves.*10:00 – 12:00 con Elena Vega \(pendiente de confirmación\)$/);
    expect(toIncident({ ...scheduled, status: 'IN_EVALUATION' }).remoteNote).toContain('pendiente de confirmación');
    expect(toIncident({ ...scheduled, visits: [] }).remoteNote).toBe('Sin visita programada');
  });

  it('explains a visit that was taken or a report that cannot be sent', async () => {
    reply(409, { code: 'slot_unavailable', detail: 'The block is full' });
    await expect(incidentsHttpApi.report(new ReportIncidentCommand('m', 'battery', 'Batería baja otra vez.', null, VISIT)))
      .rejects.toMatchObject({ status: 409, code: 'slot_unavailable', message: 'Ese técnico ya no está libre en esa franja. Elige otro horario.' });
    reply(409, { code: 'incident_already_open', detail: 'x', incidentId: 70 });
    await expect(incidentsHttpApi.report(new ReportIncidentCommand('m', 'battery', 'Batería baja otra vez.', null, VISIT)))
      .rejects.toMatchObject({ message: 'Ya hay una incidencia abierta para este dispositivo.', incidentId: '70' });
    reply(409, { code: 'other', detail: 'Something else' });
    await expect(incidentsHttpApi.report(new ReportIncidentCommand('m', 'battery', 'Batería baja otra vez.', null, VISIT)))
      .rejects.toMatchObject({ message: 'Something else' });
    await expect(incidentsHttpApi.report(new ReportIncidentCommand('m', 'battery', 'Batería baja otra vez.', null, null)))
      .rejects.toMatchObject({ status: 400 });
  });

  it('explains when the backend cannot be reached', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));
    await expect(incidentsHttpApi.list()).rejects.toMatchObject({ status: 0 });
  });

  it('uses the backend unless the sample data is asked for', async () => {
    const api = getIncidentsApi();
    expect(api.isSample).toBe(false);
    reply(404, { detail: 'Incident 7 not found' });
    await expect(api.getIncident('7')).rejects.toBeInstanceOf(IncidentNotFoundError);
    reply(500, {});
    await expect(api.getIncident('7')).rejects.toBeInstanceOf(IncidentsRequestError);
    await expect(api.requestVisitReschedule('7')).rejects.toThrow('reschedule_not_available');
    reply(200, []);
    expect(await api.listIncidents()).toEqual([]);
    reply(200, { directions: null, devices: [] });
    expect((await api.loadReportForm())?.devices).toEqual([]);
    reply(201, { ...scheduled, status: 'IN_EVALUATION' });
    const outcome = await api.reportIncident(new ReportIncidentCommand('m', 'battery', 'Batería baja otra vez.', null, VISIT), DEVICE, NO_ADDRESS);
    expect(outcome.incident.stage).toBe('evaluating');
    expect(outcome.photoAttached).toBe(true);

    vi.stubEnv('VITE_INCIDENTS_MOCK', 'true');
    const sample = getIncidentsApi();
    expect(sample.isSample).toBe(true);
    expect(await sample.loadReportForm()).toBeNull();
  });
});
