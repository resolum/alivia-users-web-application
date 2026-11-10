import { BaseApi } from '@/shared/infrastructure/base-api.ts';
import { respond } from '@/shared/infrastructure/local-collection.ts';
import { AssistedPerson, type DocumentType } from '../domain/model/assisted-person.entity.ts';
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
import { careAgendaApi, isCareAgendaConfigured } from './care-agenda-api.ts';

export { AssistanceApiError } from './assistance-api-error.ts';
export type { NetworkLogEntry } from './care-coordination.local-data.ts';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

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
 * Browser copy served with sample data.
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

const KINSHIP_TO_LABEL: Record<string, string> = {
  PARENT: 'Padre',
  GRANDPARENT: 'Abuelo/a',
  AUNT_UNCLE: 'Tío/a',
  SPOUSE: 'Cónyuge',
  SIBLING: 'Hermano/a',
  OTHER: 'Familiar',
};

function formatDisplayPhone(e164: string | null): string | null {
  if (!e164 || e164.trim() === '') return null;
  const digits = e164.replace(/\D/g, '');
  const local = digits.startsWith('51') && digits.length > 2 ? digits.slice(2) : digits;
  if (local.length === 9) {
    return `+51 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
  }
  return e164;
}

/**
 * Connected HTTP API communicating with the Assistance Bounded Context endpoints.
 */
const httpAssistanceApi: AssistanceApi = {
  isSample: false,

  getAssistedPerson: async () => {
    try {
      const response = await BaseApi.request(`${BASE_URL}/assisted-persons`, { method: 'GET' }, { authenticated: true });
      if (response.ok) {
        const data = await response.json();
        const item = Array.isArray(data) ? data[0] : data;
        if (item) {
          let householdAlias = 'Hogar';
          try {
            const hhResponse = await BaseApi.request(`${BASE_URL}/households/mine`, { method: 'GET' }, { authenticated: true });
            if (hhResponse.ok) {
              const hhData = await hhResponse.json();
              if (hhData?.alias) householdAlias = hhData.alias;
            }
          } catch {
            // Keep default
          }

          let principalCaregiverName = 'Familiar Responsable';
          try {
            const profileResponse = await BaseApi.request(`${BASE_URL}/person-profiles/mine`, { method: 'GET' }, { authenticated: true });
            if (profileResponse.ok) {
              const profileData = await profileResponse.json();
              const fullName = [profileData?.firstName, profileData?.lastName].filter(Boolean).join(' ');
              if (fullName) principalCaregiverName = fullName;
            }
          } catch {
            // Keep default
          }

          const kinshipDisplay = item.kinship ? (KINSHIP_TO_LABEL[item.kinship] ?? item.kinship) : 'Familiar';

          return new AssistedPerson({
            id: String(item.id),
            firstName: item.firstName ?? 'Persona',
            lastName: item.lastName ?? 'Asistida',
            documentType: (item.dni ? 'DNI' : 'DNI') as DocumentType,
            documentNumber: item.dni ?? '12345678',
            documentValidated: true,
            birthDate: item.birthDate ? String(item.birthDate).slice(0, 10) : '1950-01-01',
            kinship: kinshipDisplay,
            phone: formatDisplayPhone(item.phoneNumber),
            photoUrl: item.photoUrl ?? null,
            householdAlias,
            principalCaregiverName,
            principalCaregiverKinship: 'Titular',
          });
        }
      }
    } catch (e) {
      console.warn('Failed to fetch assisted person from backend, using fallback', e);
    }
    return localAssistanceApi.getAssistedPerson();
  },

  updateAssistedPerson: async (person, command) => {
    const { firstName, lastName, birthDate, kinship } = command.values;
    try {
      const response = await BaseApi.request(
        `${BASE_URL}/assisted-persons/${encodeURIComponent(person.id)}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName,
            lastName,
            birthDate,
            phoneNumber: command.phone ? command.phone.replace(/\D/g, '') : null,
            kinship,
          }),
        },
        { authenticated: true },
      );
      if (response.ok) {
        return new AssistedPerson({
          ...person,
          firstName,
          lastName,
          birthDate,
          kinship,
          phone: command.phone,
        });
      }
    } catch (e) {
      console.warn('Failed to update assisted person on backend', e);
    }
    return localAssistanceApi.updateAssistedPerson(person, command);
  },

  getCareNetwork: async () => {
    try {
      const [caregiversRes, invitationsRes] = await Promise.all([
        BaseApi.request(`${BASE_URL}/caregivers`, { method: 'GET' }, { authenticated: true }),
        BaseApi.request(`${BASE_URL}/invitations`, { method: 'GET' }, { authenticated: true }),
      ]);
      if (caregiversRes.ok) {
        const rawCaregivers = (await caregiversRes.json()) as Array<{ id?: number; status?: string }>;
        const rawInvitations = invitationsRes.ok
          ? ((await invitationsRes.json()) as Array<{ id: number; inviteeEmail: string; status: string; expiresAt?: string }>)
          : [];

        const mappedCaregivers: Caregiver[] = rawCaregivers.map(
          (c, index) =>
            new Caregiver({
              id: String(c.id ?? index + 2),
              fullName: `Cuidador ${c.id ?? index + 1}`,
              email: `cuidador${c.id ?? index + 1}@example.com`,
              phone: null,
              role: 'additional',
              relationship: 'external_caregiver',
              relationshipDetail: 'Cuidador externo',
              status: c.status?.toLowerCase() === 'active' ? 'active' : 'pending',
              responsibilities: ['view_activities', 'manage_activities'],
              linkedSince: c.status?.toLowerCase() === 'active' ? new Date().toISOString().slice(0, 10) : null,
              invitedAt: new Date().toISOString(),
              photoUrl: null,
            }),
        );

        const mappedInvitations: Caregiver[] = rawInvitations
          .filter((inv) => inv.status === 'PENDING')
          .map(
            (inv) =>
              new Caregiver({
                id: String(inv.id),
                fullName: inv.inviteeEmail.split('@')[0],
                email: inv.inviteeEmail,
                phone: null,
                role: 'additional',
                relationship: 'external_caregiver',
                relationshipDetail: 'Invitación pendiente',
                status: 'pending',
                responsibilities: ['view_activities', 'manage_activities'],
                linkedSince: null,
                invitedAt: inv.expiresAt
                  ? new Date(new Date(inv.expiresAt).getTime() - 7 * 86_400_000).toISOString()
                  : new Date().toISOString(),
                photoUrl: null,
              }),
          );

        const localNet = await localAssistanceApi.getCareNetwork();
        const additional = [...mappedCaregivers, ...mappedInvitations];
        return {
          householdAlias: localNet.householdAlias,
          assistedPersonName: localNet.assistedPersonName,
          principal: localNet.principal,
          additional: additional.length > 0 ? additional : localNet.additional,
        };
      }
    } catch (e) {
      console.warn('Failed to load care network from backend, using fallback', e);
    }
    return localAssistanceApi.getCareNetwork();
  },

  inviteCaregiver: async (command) => {
    try {
      const response = await BaseApi.request(
        `${BASE_URL}/invitations`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            relativeId: 1,
            assistedPersonId: 1,
            inviteeEmail: command.email,
          }),
        },
        { authenticated: true },
      );
      if (response.ok) {
        const id = await response.json();
        const caregiver = new Caregiver({
          id: String(id),
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
        return caregiver;
      }
    } catch (e) {
      console.warn('Failed to invite caregiver on backend, using fallback', e);
    }
    return localAssistanceApi.inviteCaregiver(command);
  },

  resendInvitation: async (caregiverId) => {
    try {
      await BaseApi.request(
        `${BASE_URL}/invitations/${encodeURIComponent(caregiverId)}/resend`,
        { method: 'POST' },
        { authenticated: true },
      );
      logNetworkChange(`Se reenvió la invitación.`);
    } catch (e) {
      console.warn('Failed to resend invitation on backend, using fallback', e);
    }
    return localAssistanceApi.resendInvitation(caregiverId);
  },

  updateResponsibilities: async (caregiverId, responsibilities) => {
    return localAssistanceApi.updateResponsibilities(caregiverId, responsibilities);
  },

  removeCaregiver: async (caregiverId, actorName) => {
    try {
      await Promise.allSettled([
        BaseApi.request(`${BASE_URL}/caregivers/${encodeURIComponent(caregiverId)}/revoke`, { method: 'POST' }, { authenticated: true }),
        BaseApi.request(`${BASE_URL}/invitations/${encodeURIComponent(caregiverId)}/revoke`, { method: 'POST' }, { authenticated: true }),
      ]);
    } catch (e) {
      console.warn('Failed to revoke caregiver on backend, continuing locally', e);
    }
    return localAssistanceApi.removeCaregiver(caregiverId, actorName);
  },

  pendingDutiesOf: async (caregiverId) => localAssistanceApi.pendingDutiesOf(caregiverId),

  listNetworkLog: async () => localAssistanceApi.listNetworkLog(),

  getInvitation: async (token) => {
    try {
      const response = await BaseApi.request(
        `${BASE_URL}/invitations/${encodeURIComponent(token)}`,
        { method: 'GET' },
        { authenticated: false },
      );
      if (response.ok) {
        const inv = (await response.json()) as { id: number; inviteeEmail: string; status: string };
        return {
          token: String(inv.id),
          caregiverId: String(inv.id),
          email: inv.inviteeEmail,
          ...SAMPLE_HOUSEHOLD,
          invitedByName: 'Familiar Responsable',
          invitedByRelationship: 'Familiar',
          responsibilities: ['view_activities', 'manage_activities'],
          status: inv.status === 'ACCEPTED' ? 'accepted' : inv.status === 'PENDING' ? 'active' : 'expired',
        };
      }
    } catch (e) {
      console.warn('Failed to get invitation from backend, using fallback', e);
    }
    return localAssistanceApi.getInvitation(token);
  },

  answerInvitation: async (token, accept) => {
    try {
      if (accept) {
        const response = await BaseApi.request(
          `${BASE_URL}/invitations/${encodeURIComponent(token)}/accept`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ caregiverUserId: 1 }),
          },
          { authenticated: true },
        );
        if (response.ok) {
          return localAssistanceApi.answerInvitation(token, true);
        }
      } else {
        await BaseApi.request(
          `${BASE_URL}/invitations/${encodeURIComponent(token)}/revoke`,
          { method: 'POST' },
          { authenticated: true },
        );
        return localAssistanceApi.answerInvitation(token, false);
      }
    } catch (e) {
      console.warn('Failed to answer invitation on backend, using fallback', e);
    }
    return localAssistanceApi.answerInvitation(token, accept);
  },

  listActivities: (from, to) => careAgendaApi.list(from, to),

  scheduleActivity: async (command, caregiverName, actor) => {
    allowActivities(actor);
    const { type, ...values } = command.values;
    try {
      const createResponse = await BaseApi.request(
        `${BASE_URL}/activities`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            relativeId: 1,
            assistedPersonId: 1,
            type: (type || 'hygiene').toUpperCase(),
            title: values.title,
            description: values.notes || values.title,
          }),
        },
        { authenticated: true },
      );
      if (createResponse.ok) {
        const activityId = await createResponse.json();
        const [hours, minutes] = values.time.split(':').map(Number);
        const duration = values.durationMinutes ?? 30;
        const endMinutes = hours * 60 + minutes + duration;
        const endH = Math.floor(endMinutes / 60) % 24;
        const endM = endMinutes % 60;
        const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00`;

        await BaseApi.request(
          `${BASE_URL}/activities/${activityId}/assignments`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              relativeId: 1,
              caregiverId: Number(values.caregiverId) || null,
              scheduleType: values.repetition === 'none' ? 'ONCE' : 'WEEKLY',
              days: values.repetition === 'none' ? [] : ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
              date: values.date,
              startTime: `${values.time}:00`,
              endTime,
            }),
          },
          { authenticated: true },
        );
      }
    } catch (e) {
      console.warn('Failed to schedule activity on backend, saving locally', e);
    }
    return localAssistanceApi.scheduleActivity(command, caregiverName, actor);
  },

  completeActivity: async (activityId, actor) => {
    allowActivities(actor);
    const [assignmentPart, stamp] = activityId.split('-');
    const assignmentId = Number(assignmentPart);
    const date = stamp
      ? `${stamp.slice(0, 4)}-${stamp.slice(4, 6)}-${stamp.slice(6, 8)}`
      : new Date().toISOString().slice(0, 10);
    try {
      await BaseApi.request(
        `${BASE_URL}/activity-logs/complete`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            careActivityId: 1,
            assignmentId: isNaN(assignmentId) ? 1 : assignmentId,
            date,
            caregiverUserId: Number(actor.id) || 1,
            notes: 'Completado por ' + actor.fullName,
          }),
        },
        { authenticated: true },
      );
      if (activityId.includes('medication')) {
        await careAgendaApi.recordAdministered(activityId);
      }
    } catch (e) {
      console.warn('Failed to complete activity log on backend', e);
    }
    return localAssistanceApi.completeActivity(activityId, actor);
  },

  cancelActivity: async (activityId, actor) => {
    allowActivities(actor);
    const [assignmentPart, stamp] = activityId.split('-');
    const assignmentId = Number(assignmentPart);
    const date = stamp
      ? `${stamp.slice(0, 4)}-${stamp.slice(4, 6)}-${stamp.slice(6, 8)}`
      : new Date().toISOString().slice(0, 10);
    try {
      await BaseApi.request(
        `${BASE_URL}/activity-logs/cancel`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            careActivityId: 1,
            assignmentId: isNaN(assignmentId) ? 1 : assignmentId,
            date,
            relativeId: Number(actor.id) || 1,
          }),
        },
        { authenticated: true },
      );
    } catch (e) {
      console.warn('Failed to cancel activity on backend', e);
    }
    return localAssistanceApi.cancelActivity(activityId, actor);
  },
};

export function getAssistanceApi(): AssistanceApi {
  return isCareAgendaConfigured() ? httpAssistanceApi : localAssistanceApi;
}
