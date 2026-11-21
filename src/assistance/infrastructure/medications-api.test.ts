import { afterEach, describe, expect, it, vi } from 'vitest';
import { Caregiver } from '../domain/model/caregiver.entity.ts';
import { ScheduleMedicationCommand, UpdateMedicationCommand, SuspendMedicationCommand } from '../domain/model/medication.commands.ts';
import { getCareCoordinationApi } from './care-coordination-api.ts';

vi.hoisted(() => {
  vi.stubEnv('VITE_API_BASE_URL', '/api/v1');
  vi.stubEnv('VITE_CARE_AGENDA_ENDPOINT_PATH', 'care-agenda');
  vi.stubEnv('VITE_MEDICATIONS_ENDPOINT_PATH', 'medications');
});

const caregiver = new Caregiver({
  id: '2',
  fullName: 'María Ramos',
  relationship: 'external_caregiver',
  relationshipDetail: 'Cuidadora',
  role: 'additional',
  status: 'active',
  email: 'maria@example.com',
  phone: '999888777',
  photoUrl: '',
  linkedSince: '2026-01-01',
  invitedAt: '2026-01-01',
  responsibilities: ['manage_medications', 'record_medications'],
});

const actor = new Caregiver({
  id: '1',
  fullName: 'Juan Pérez',
  relationship: 'family',
  relationshipDetail: 'Familiar',
  role: 'principal',
  status: 'active',
  email: 'juan@example.com',
  phone: '999111222',
  photoUrl: '',
  linkedSince: '2026-01-01',
  invitedAt: '2026-01-01',
  responsibilities: ['manage_medications', 'record_medications'],
});

const sampleResource = {
  id: '1',
  medication: 'Losartan',
  dose: '50 mg',
  assistedPersonId: '8',
  caregiverId: '2',
  caregiverName: 'María Ramos',
  startDate: '2026-11-07',
  endDate: null,
  status: 'active',
  revisions: [
    {
      effectiveFrom: '2026-11-07',
      dose: '50 mg',
      times: ['08:00'],
      frequency: 'daily',
      indicationRef: 'Receta Dr. Paredes',
      recordedAt: '2026-11-07T12:00:00Z',
      recordedByName: 'Juan Pérez',
    },
  ],
  suspension: null,
};

describe('careCoordinationApi - medications with backend', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('lists medications from backend', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([sampleResource]), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const api = getCareCoordinationApi();
    const plans = await api.listMedications();

    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/v1/medications');
    expect(plans).toHaveLength(1);
    expect(plans[0]?.medication).toBe('Losartan');
    expect(plans[0]?.statusOn('2026-11-07')).toBe('active');
  });

  it('schedules medication calling POST on backend', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(sampleResource), { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);

    const api = getCareCoordinationApi();
    const command = new ScheduleMedicationCommand({
      medication: 'Losartan',
      dose: '50 mg',
      times: ['08:00'],
      frequency: 'daily',
      startDate: '2026-11-07',
      endDate: '',
      caregiverId: '2',
      assistedPersonId: '8',
      indicationRef: 'Receta Dr. Paredes',
    });

    const created = await api.scheduleMedication(command, caregiver, actor);

    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/v1/assisted-persons/8/medications');
    expect(fetchMock.mock.calls[0]?.[1]?.method).toBe('POST');
    expect(created.medication).toBe('Losartan');
  });

  it('updates medication calling PUT on backend', async () => {
    const updatedResource = { ...sampleResource, dose: '100 mg' };
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(updatedResource), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const api = getCareCoordinationApi();
    const command = new UpdateMedicationCommand('1', {
      dose: '100 mg',
      times: ['08:00', '20:00'],
      frequency: 'daily',
      effectiveFrom: '2026-11-08',
      indicationRef: 'Ajuste',
    });

    const updated = await api.updateMedication(command, actor);

    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/v1/medications/1');
    expect(fetchMock.mock.calls[0]?.[1]?.method).toBe('PUT');
    expect(updated.latest.dose).toBe('50 mg'); // from revisions
  });

  it('suspends medication calling POST suspend on backend', async () => {
    const suspendedResource = {
      ...sampleResource,
      status: 'suspended',
      suspension: { from: '2026-11-08', source: 'Dr. Salas', recordedAt: '2026-11-08T00:00:00Z', recordedByName: 'Juan' },
    };
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(suspendedResource), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const api = getCareCoordinationApi();
    const command = new SuspendMedicationCommand('1', '2026-11-08', 'Dr. Salas');
    const suspended = await api.suspendMedication(command, actor);

    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/v1/medications/1/suspend');
    expect(fetchMock.mock.calls[0]?.[1]?.method).toBe('POST');
    expect(suspended.isSuspendedOn('2026-11-09')).toBe(true);
  });

  it('assigns responsible caregiver calling PATCH on backend', async () => {
    const reassignedResource = { ...sampleResource, caregiverId: '3' };
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(reassignedResource), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const api = getCareCoordinationApi();
    const newCaregiver = new Caregiver({ ...caregiver, id: '3' });
    const reassigned = await api.assignMedicationResponsible('1', newCaregiver, actor);

    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/v1/medications/1/responsible');
    expect(fetchMock.mock.calls[0]?.[1]?.method).toBe('PATCH');
    expect(reassigned.caregiverId).toBe('3');
  });
});
