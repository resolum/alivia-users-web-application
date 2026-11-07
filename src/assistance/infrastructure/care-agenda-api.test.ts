import { afterEach, describe, expect, it, vi } from 'vitest';
import { careAgendaApi, type AgendaOccurrenceResource } from './care-agenda-api.ts';

// The API module reads its paths when it loads, so they are set before the import runs.
vi.hoisted(() => {
  vi.stubEnv('VITE_API_BASE_URL', '/api/v1');
  vi.stubEnv('VITE_CARE_AGENDA_ENDPOINT_PATH', 'care-agenda');
  vi.stubEnv('VITE_MEDICATION_OUTCOMES_ENDPOINT_PATH', 'medication-administrations/{administrationId}/outcomes');
});

const occurrence: AgendaOccurrenceResource = {
  activity: { id: 3, title: 'Losartán 50 mg', type: 'MEDICATION' },
  assignmentId: 12,
  assistedPerson: { id: 8, name: 'Alberto' },
  date: '2026-10-26',
  startTime: '22:00:00',
  endTime: '06:00:00',
  startsAt: '2026-10-26T22:00:00',
  endsAt: '2026-10-27T06:00:00',
  responsible: { id: 7, personProfileId: 15, name: 'Ana Torres', email: 'ana@example.com' },
  recurring: true,
  status: 'MISSED',
  priority: 'HIGH',
};

describe('careAgendaApi', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('reads the agenda as care activities keyed like medication administrations', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([occurrence]), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const [activity] = await careAgendaApi.list('2026-10-26', '2026-11-01');

    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/v1/care-agenda?from=2026-10-26&to=2026-11-01');
    expect(activity).toMatchObject({
      id: '12-20261026', type: 'medication', time: '22:00', durationMinutes: 480,
      repetition: 'daily', caregiverName: 'Ana Torres', status: 'scheduled',
    });
  });

  it('records a dose as given and reports an outcome that already exists', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);

    await careAgendaApi.recordAdministered('12-20261026');

    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/v1/medication-administrations/12-20261026/outcomes');
    expect(JSON.parse(fetchMock.mock.calls[0]?.[1].body as string)).toMatchObject({ result: 'ADMINISTERED' });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 409 })));
    await expect(careAgendaApi.recordAdministered('12-20261026')).rejects.toMatchObject({ code: 'already_recorded' });
  });

  it('records an omitted dose with its reason and returns the stored one when it already had an outcome', async () => {
    const stored = {
      administrationId: '12-20261026', medication: 'Losartan 50 mg', assistedPerson: { id: 8, name: 'Alberto' },
      date: '2026-10-26', startTime: '08:00:00', endTime: '09:00:00', responsible: { type: 'CAREGIVER', id: 7, name: 'Ana' },
      status: 'OMITTED', outcome: { result: 'OMITTED', occurredAt: '2026-10-26T08:15:00', reason: 'Lo rechazó' },
    };
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(stored), { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);

    const saved = await careAgendaApi.recordOutcome('12-20261026', 'omitted', 'Lo rechazó');

    expect(JSON.parse(fetchMock.mock.calls[0]?.[1].body as string)).toMatchObject({ result: 'OMITTED', reason: 'Lo rechazó' });
    expect(saved).toMatchObject({ id: '12-20261026', medication: 'Losartan 50 mg', result: 'omitted', reason: 'Lo rechazó' });

    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(new Response('{}', { status: 409 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(stored), { status: 200 })));
    await expect(careAgendaApi.recordOutcome('12-20261026', 'given', '')).rejects.toMatchObject({
      code: 'already_recorded', existing: expect.objectContaining({ result: 'omitted' }),
    });
  });
});
