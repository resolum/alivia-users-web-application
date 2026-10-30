import { describe, expect, it } from 'vitest';
import { Caregiver } from '../domain/model/caregiver.entity.ts';
import { getAssistanceApi } from './assistance-api.ts';
import { activities, caregivers } from './assistance.local-data.ts';
import { getCareCoordinationApi } from './care-coordination-api.ts';
import { handovers, shifts } from './care-coordination.local-data.ts';

const caregiver = (id: string) => new Caregiver(caregivers.find(id)!);
const empty = { attended: [], pending: [] };

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
