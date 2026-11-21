import { describe, expect, it, vi } from 'vitest';
import { Caregiver } from '../domain/model/caregiver.entity.ts';
import { AssignShiftCommand } from '../domain/model/assign-shift.command.ts';
import { getAssistanceApi } from './assistance-api.ts';
import { activities, caregivers } from './assistance.local-data.ts';
import { getCareCoordinationApi } from './care-coordination-api.ts';
import { handovers, shifts } from './care-coordination.local-data.ts';

const caregiver = (id: string) => new Caregiver(caregivers.find(id)!);
const empty = { attended: [], pending: [] };

describe('shifts and handovers HTTP API integration', () => {
  const api = getCareCoordinationApi();

  it('lists shifts from backend when fetch returns 200', async () => {
    const mockShifts = [
      {
        id: '10',
        caregiverId: '2',
        caregiverName: 'Carlos Lopez',
        startsAt: '2026-11-09T08:00:00.000Z',
        endsAt: '2026-11-09T16:00:00.000Z',
        notes: 'Turno mañana',
      },
    ];

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockShifts), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await api.listShifts(new Date('2026-11-09T00:00:00Z'), new Date('2026-11-09T23:59:59Z'));
    expect(result).toHaveLength(1);
    expect(result[0].caregiverName).toBe('Carlos Lopez');
    expect(fetchSpy).toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('saves shift via backend HTTP POST', async () => {
    const mockCreated = {
      id: '15',
      caregiverId: '2',
      caregiverName: 'Carlos Lopez',
      startsAt: '2026-11-10T08:00:00.000Z',
      endsAt: '2026-11-10T16:00:00.000Z',
      notes: 'Guardia',
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockCreated), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const cmd = new AssignShiftCommand(null, {
      caregiverId: '2',
      date: '2026-11-10',
      startTime: '08:00',
      endTime: '16:00',
      notes: 'Guardia',
    });

    const result = await api.saveShift(cmd, 'Carlos Lopez', false);
    expect(result.id).toBe('15');
    expect(result.caregiverName).toBe('Carlos Lopez');
    expect(fetchSpy).toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('requests handover via backend HTTP POST', async () => {
    const mockHandover = {
      id: '50',
      fromShiftId: '10',
      toShiftId: '11',
      fromCaregiverId: '2',
      fromCaregiverName: 'Carlos Lopez',
      toCaregiverId: '3',
      toCaregiverName: 'Ana Gomez',
      status: 'pending',
      requestedAt: '2026-11-09T15:00:00.000Z',
      respondedAt: null,
      escalatedAt: null,
      attended: ['Tarea 1'],
      pending: ['Tarea 2'],
      substitute: false,
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockHandover), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await api.requestHandover('10', '11', { attended: ['Tarea 1'], pending: ['Tarea 2'] });
    expect(result.id).toBe('50');
    expect(result.status).toBe('pending');
    expect(fetchSpy).toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});

describe('relief with a substitute', () => {
  const api = getCareCoordinationApi();
  const principal = caregiver('cg-principal');
  const carlos = caregiver('cg-carlos');

  it('moves the shift only once the substitute accepts it', async () => {
    // Seed ho-2: Carlos hands sh-4 over to María, who cannot take it.
    const substitute = new Caregiver({ ...carlos, id: 'cg-sub', fullName: 'Sustituto' });
    caregivers.save({ ...substitute });
    await api.answerHandover('ho-2', false, caregiver('cg-principal'), empty);
    expect(handovers.find('ho-2')?.status).toBe('declined');

    await api.proposeSubstitute('ho-2', substitute, carlos);
    expect(shifts.find('sh-4')?.caregiverId).toBe(principal.id);
    await expect(api.answerHandover('ho-2', true, principal, empty)).rejects.toMatchObject({ code: 'forbidden' });

    const done = await api.answerHandover('ho-2', true, substitute, empty);
    expect(done.status).toBe('reassigned');
    expect(shifts.find('sh-4')?.caregiverId).toBe('cg-sub');
  });
});

describe('activity permissions', () => {
  it('rejects completing an activity without the manage responsibility', async () => {
    const viewer = new Caregiver({ ...caregiver('cg-carlos'), id: 'cg-viewer', responsibilities: ['view_activities'] });
    const [open] = activities.all().filter((item) => item.status === 'scheduled');
    await expect(getAssistanceApi().completeActivity(open.id, viewer)).rejects.toMatchObject({ code: 'forbidden' });
    expect(activities.find(open.id)?.status).toBe('scheduled');
  });
});

describe('rejected invitation', () => {
  it('keeps saying it was rejected and never creates the membership', async () => {
    const api = getAssistanceApi();
    caregivers.save({ ...caregiver('cg-carlos'), id: 'cg-rejecting', email: 'rechaza@correo.pe', status: 'pending', invitedAt: new Date().toISOString() });
    await api.answerInvitation('cg-rejecting', false);

    expect((await api.getInvitation('cg-rejecting')).status).toBe('rejected');
    await expect(api.answerInvitation('cg-rejecting', true)).rejects.toMatchObject({ code: 'invitation_closed' });
    expect(caregivers.find('cg-rejecting')).toBeUndefined();
  });
});
