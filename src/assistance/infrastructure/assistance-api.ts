import { respond } from '@/shared/infrastructure/local-collection.ts';
import { AssistedPerson } from '../domain/model/assisted-person.entity.ts';
import { CareActivity } from '../domain/model/care-activity.entity.ts';
import { Caregiver, type CareNetwork } from '../domain/model/caregiver.entity.ts';
import type { InviteCaregiverCommand } from '../domain/model/invite-caregiver.command.ts';
import type { Invitation } from '../domain/model/invitation.ts';
import type { ScheduleActivityCommand } from '../domain/model/schedule-activity.command.ts';
import type { UpdateAssistedPersonCommand } from '../domain/model/update-assisted-person.command.ts';
import { activities, assistedPersons, caregivers, SAMPLE_HOUSEHOLD } from './assistance.local-data.ts';

export interface AssistanceApi {
  /** True while the screens are served by the browser copy instead of the backend. */
  readonly isSample: boolean;
  getAssistedPerson(): Promise<AssistedPerson>;
  updateAssistedPerson(person: AssistedPerson, command: UpdateAssistedPersonCommand): Promise<AssistedPerson>;
  getCareNetwork(): Promise<CareNetwork>;
  inviteCaregiver(command: InviteCaregiverCommand): Promise<Caregiver>;
  resendInvitation(caregiverId: string): Promise<Caregiver>;
  updateResponsibilities(caregiverId: string, responsibilities: Caregiver['responsibilities']): Promise<Caregiver>;
  removeCaregiver(caregiverId: string): Promise<void>;
  getInvitation(token: string): Promise<Invitation>;
  answerInvitation(token: string, accept: boolean): Promise<Invitation>;
  listActivities(from: string, to: string): Promise<CareActivity[]>;
  scheduleActivity(command: ScheduleActivityCommand, caregiverName: string): Promise<CareActivity>;
  completeActivity(activityId: string): Promise<CareActivity>;
  cancelActivity(activityId: string): Promise<CareActivity>;
}

export class AssistanceApiError extends Error {
  readonly code: 'not_found';
  constructor(code: 'not_found') {
    super(code);
    this.code = code;
    this.name = 'AssistanceApiError';
  }
}

function requireCaregiver(id: string) {
  const found = caregivers.find(id);
  if (!found) throw new AssistanceApiError('not_found');
  return found;
}

function requireActivity(id: string) {
  const found = activities.find(id);
  if (!found) throw new AssistanceApiError('not_found');
  return found;
}

function toInvitation(caregiverId: string): Invitation {
  const invited = requireCaregiver(caregiverId);
  const principal = caregivers.all().find((item) => item.role === 'principal');
  const answered = invited.status === 'active';
  return {
    token: caregiverId,
    caregiverId,
    email: invited.email,
    ...SAMPLE_HOUSEHOLD,
    invitedByName: principal?.fullName ?? '',
    invitedByRelationship: 'Familiar',
    responsibilities: invited.responsibilities,
    status: answered ? 'accepted' : invited.status === 'expired' ? 'expired' : 'active',
  };
}

/**
 * shortcut: the assistance contract (care network, invitations, agenda) is still
 * pending, so this port is served from the browser with the Figma example data.
 * Add the HTTP implementation next to it and return it from getAssistanceApi().
 */
const localAssistanceApi: AssistanceApi = {
  isSample: true,

  getAssistedPerson: async () => {
    const [person] = await respond(assistedPersons.all());
    if (!person) throw new AssistanceApiError('not_found');
    return new AssistedPerson(person);
  },

  updateAssistedPerson: async (person, command) => {
    const { firstName, lastName, birthDate, kinship } = command.values;
    const saved = assistedPersons.save({ ...person, firstName, lastName, birthDate, kinship, phone: command.phone });
    return new AssistedPerson(await respond(saved));
  },

  getCareNetwork: async () => {
    const all = (await respond(caregivers.all())).map((props) => new Caregiver(props));
    const principal = all.find((item) => item.isPrincipal);
    if (!principal) throw new AssistanceApiError('not_found');
    return { ...SAMPLE_HOUSEHOLD, principal, additional: all.filter((item) => !item.isPrincipal) };
  },

  inviteCaregiver: async (command) => {
    const props = caregivers.save({
      id: crypto.randomUUID(),
      fullName: command.email.split('@')[0],
      email: command.email,
      phone: null,
      role: 'additional',
      relationship: command.relationship || 'other',
      relationshipDetail:
        command.relationship === 'family' ? 'Familiar' : command.relationship === 'health_professional' ? 'Profesional de salud' : 'Cuidador externo',
      status: 'pending',
      responsibilities: command.responsibilities,
      linkedSince: null,
      invitedAt: new Date().toISOString(),
      photoUrl: null,
    });
    return respond(props).then((saved) => new Caregiver(saved));
  },

  resendInvitation: async (caregiverId) => {
    const saved = caregivers.save({ ...requireCaregiver(caregiverId), status: 'pending', invitedAt: new Date().toISOString() });
    return respond(saved).then((props) => new Caregiver(props));
  },

  updateResponsibilities: async (caregiverId, responsibilities) => {
    const saved = caregivers.save({ ...requireCaregiver(caregiverId), responsibilities });
    return respond(saved).then((props) => new Caregiver(props));
  },

  removeCaregiver: async (caregiverId) => {
    caregivers.replaceAll(caregivers.all().filter((item) => item.id !== caregiverId));
    return respond(undefined);
  },

  getInvitation: async (token) => respond(toInvitation(token)),

  answerInvitation: async (token, accept) => {
    const invited = requireCaregiver(token);
    if (accept) {
      caregivers.save({ ...invited, status: 'active', linkedSince: new Date().toISOString().slice(0, 10) });
      return respond(toInvitation(token));
    }
    const invitation = toInvitation(token);
    caregivers.replaceAll(caregivers.all().filter((item) => item.id !== token));
    return respond({ ...invitation, status: 'rejected' as const });
  },

  listActivities: async (from, to) => {
    const found = activities.all().filter((item) => item.date >= from && item.date <= to);
    return respond(found).then((list) => list.map((props) => new CareActivity(props)));
  },

  scheduleActivity: async (command, caregiverName) => {
    const { type, ...values } = command.values;
    const current = command.activityId ? requireActivity(command.activityId) : null;
    const saved = activities.save({
      ...values,
      type: type || 'hygiene',
      id: current?.id ?? crypto.randomUUID(),
      caregiverName,
      tag: current?.tag ?? null,
      status: current?.status ?? 'scheduled',
      completedAt: current?.completedAt ?? null,
    });
    return respond(saved).then((props) => new CareActivity(props));
  },

  completeActivity: async (activityId) => {
    const saved = activities.save({ ...requireActivity(activityId), status: 'completed', completedAt: new Date().toISOString() });
    return respond(saved).then((props) => new CareActivity(props));
  },

  cancelActivity: async (activityId) => {
    const saved = activities.save({ ...requireActivity(activityId), status: 'cancelled' });
    return respond(saved).then((props) => new CareActivity(props));
  },
};

export function getAssistanceApi(): AssistanceApi {
  return localAssistanceApi;
}
