import { respond } from '@/shared/infrastructure/local-collection.ts';
import { AssistedPerson } from '../domain/model/assisted-person.entity.ts';
import { CareActivity } from '../domain/model/care-activity.entity.ts';
import { Caregiver, type CareNetwork } from '../domain/model/caregiver.entity.ts';
import type { InviteCaregiverCommand } from '../domain/model/invite-caregiver.command.ts';
import type { Invitation } from '../domain/model/invitation.ts';
import type { ScheduleActivityCommand } from '../domain/model/schedule-activity.command.ts';
import type { UpdateAssistedPersonCommand } from '../domain/model/update-assisted-person.command.ts';
import { AssistanceApiError } from './assistance-api-error.ts';
import { activities, assistedPersons, caregivers, rejectedInvitations, SAMPLE_HOUSEHOLD } from './assistance.local-data.ts';
import { logNetworkChange, networkLog, type NetworkLogEntry } from './care-coordination.local-data.ts';
import { pendingDutiesOf } from './care-coordination-api.ts';

export { AssistanceApiError } from './assistance-api-error.ts';
export type { NetworkLogEntry } from './care-coordination.local-data.ts';

export interface AssistanceApi {
  /** True while the screens are served by the browser copy instead of the backend. */
  readonly isSample: boolean;
  getAssistedPerson(): Promise<AssistedPerson>;
  updateAssistedPerson(person: AssistedPerson, command: UpdateAssistedPersonCommand): Promise<AssistedPerson>;
  getCareNetwork(): Promise<CareNetwork>;
  inviteCaregiver(command: InviteCaregiverCommand): Promise<Caregiver>;
  resendInvitation(caregiverId: string): Promise<Caregiver>;
  updateResponsibilities(caregiverId: string, responsibilities: Caregiver['responsibilities']): Promise<Caregiver>;
  /** Rejects with `has_pending` while the caregiver still has active responsibilities. */
  removeCaregiver(caregiverId: string, actorName: string): Promise<void>;
  pendingDutiesOf(caregiverId: string): Promise<string[]>;
  listNetworkLog(): Promise<NetworkLogEntry[]>;
  getInvitation(token: string): Promise<Invitation>;
  /** Rejects with `invitation_closed` unless the invitation is still valid. */
  answerInvitation(token: string, accept: boolean): Promise<Invitation>;
  listActivities(from: string, to: string): Promise<CareActivity[]>;
  /** The activity calls reject with `forbidden` unless `actor` can manage activities. */
  scheduleActivity(command: ScheduleActivityCommand, caregiverName: string, actor: Caregiver): Promise<CareActivity>;
  completeActivity(activityId: string, actor: Caregiver): Promise<CareActivity>;
  cancelActivity(activityId: string, actor: Caregiver): Promise<CareActivity>;
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

function allowActivities(actor: Caregiver) {
  if (!actor.can('manage_activities')) throw new AssistanceApiError('forbidden');
}

function toInvitation(caregiverId: string): Invitation {
  const invited = requireCaregiver(caregiverId);
  const principal = caregivers.all().find((item) => item.role === 'principal');
  const answered = invited.status === 'active';
  const status = new Caregiver(invited).statusAt();
  return {
    token: caregiverId,
    caregiverId,
    email: invited.email,
    ...SAMPLE_HOUSEHOLD,
    invitedByName: principal?.fullName ?? '',
    invitedByRelationship: 'Familiar',
    responsibilities: invited.responsibilities,
    status: answered ? 'accepted' : status === 'expired' ? 'expired' : 'active',
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
    logNetworkChange(`Se invitó a ${command.email}; la invitación vence en 7 días.`);
    return respond(props).then((saved) => new Caregiver(saved));
  },

  resendInvitation: async (caregiverId) => {
    const saved = caregivers.save({ ...requireCaregiver(caregiverId), status: 'pending', invitedAt: new Date().toISOString() });
    logNetworkChange(`Se reenvió la invitación a ${saved.email}.`);
    return respond(saved).then((props) => new Caregiver(props));
  },

  updateResponsibilities: async (caregiverId, responsibilities) => {
    const saved = caregivers.save({ ...requireCaregiver(caregiverId), responsibilities });
    logNetworkChange(`Se actualizaron las responsabilidades de ${saved.fullName}.`);
    return respond(saved).then((props) => new Caregiver(props));
  },

  removeCaregiver: async (caregiverId, actorName) => {
    const removed = requireCaregiver(caregiverId);
    if (removed.role === 'principal') throw new AssistanceApiError('forbidden');
    // Only linked caregivers can hold duties; an open invitation is simply withdrawn.
    if (removed.status === 'active' && pendingDutiesOf(caregiverId).length > 0) throw new AssistanceApiError('has_pending');
    caregivers.replaceAll(caregivers.all().filter((item) => item.id !== caregiverId));
    logNetworkChange(
      removed.status === 'active'
        ? `${actorName} desvinculó a ${removed.fullName}; sus permisos fueron revocados.`
        : `${actorName} canceló la invitación de ${removed.email}.`,
    );
    return respond(undefined);
  },

  pendingDutiesOf: async (caregiverId) => respond(pendingDutiesOf(caregiverId)),

  listNetworkLog: async () => respond([...networkLog.all()].sort((a, b) => b.at.localeCompare(a.at))),

  getInvitation: async (token) => respond(rejectedInvitations.find(token) ?? toInvitation(token)),

  answerInvitation: async (token, accept) => {
    if (rejectedInvitations.find(token)) throw new AssistanceApiError('invitation_closed');
    const invited = requireCaregiver(token);
    const invitation = toInvitation(token);
    // Rejected, expired or used invitations never create a membership.
    if (invitation.status !== 'active') throw new AssistanceApiError('invitation_closed');
    if (accept) {
      caregivers.save({ ...invited, status: 'active', linkedSince: new Date().toISOString().slice(0, 10) });
      logNetworkChange(`${invited.email} aceptó la invitación y quedó vinculado con sus permisos.`);
      return respond(toInvitation(token));
    }
    caregivers.replaceAll(caregivers.all().filter((item) => item.id !== token));
    const rejected = rejectedInvitations.save({ ...invitation, id: token, status: 'rejected' });
    logNetworkChange(`${invited.email} rechazó la invitación.`);
    return respond(rejected);
  },

  listActivities: async (from, to) => {
    const found = activities.all().filter((item) => item.date >= from && item.date <= to);
    return respond(found).then((list) => list.map((props) => new CareActivity(props)));
  },

  scheduleActivity: async (command, caregiverName, actor) => {
    allowActivities(actor);
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
      completedByName: current?.completedByName ?? null,
    });
    return respond(saved).then((props) => new CareActivity(props));
  },

  completeActivity: async (activityId, actor) => {
    allowActivities(actor);
    const current = requireActivity(activityId);
    if (current.status !== 'scheduled') return new CareActivity(await respond(current));
    const saved = activities.save({ ...current, status: 'completed', completedAt: new Date().toISOString(), completedByName: actor.fullName });
    return respond(saved).then((props) => new CareActivity(props));
  },

  cancelActivity: async (activityId, actor) => {
    allowActivities(actor);
    const saved = activities.save({ ...requireActivity(activityId), status: 'cancelled' });
    return respond(saved).then((props) => new CareActivity(props));
  },
};

export function getAssistanceApi(): AssistanceApi {
  return localAssistanceApi;
}
