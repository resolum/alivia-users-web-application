import { addDays, toIsoDate } from '@/shared/domain/model/valueobjects/relative-time.ts';
import type { AssistedPerson } from '../domain/model/assisted-person.entity.ts';
import type { CareActivity } from '../domain/model/care-activity.entity.ts';
import type { Caregiver, CareNetwork, Responsibility } from '../domain/model/caregiver.entity.ts';
import type { InviteCaregiverCommand } from '../domain/model/invite-caregiver.command.ts';
import type { ScheduleActivityCommand } from '../domain/model/schedule-activity.command.ts';
import type { UpdateAssistedPersonCommand } from '../domain/model/update-assisted-person.command.ts';
import { getAssistanceApi } from '../infrastructure/assistance-api.ts';

const api = () => getAssistanceApi();

export const isAssistanceSample = () => api().isSample;

export const loadAssistedPerson = (): Promise<AssistedPerson> => api().getAssistedPerson();

export function updateAssistedPerson(person: AssistedPerson, command: UpdateAssistedPersonCommand): Promise<AssistedPerson> {
  if (Object.keys(command.validate()).length > 0) return Promise.reject(new Error('validation_failed'));
  return api().updateAssistedPerson(person, command);
}

export const loadCareNetwork = (): Promise<CareNetwork> => api().getCareNetwork();

export function inviteCaregiver(network: CareNetwork, command: InviteCaregiverCommand): Promise<Caregiver> {
  const taken = [network.principal, ...network.additional].map((caregiver) => caregiver.email);
  if (Object.keys(command.validate(taken)).length > 0) return Promise.reject(new Error('validation_failed'));
  return api().inviteCaregiver(command);
}

export const resendInvitation = (caregiverId: string) => api().resendInvitation(caregiverId);
export const removeCaregiver = (caregiverId: string) => api().removeCaregiver(caregiverId);
export const updateResponsibilities = (caregiverId: string, responsibilities: readonly Responsibility[]) =>
  api().updateResponsibilities(caregiverId, responsibilities);

export const loadInvitation = (token: string) => api().getInvitation(token);
export const answerInvitation = (token: string, accept: boolean) => api().answerInvitation(token, accept);

/** Activities of the 7 days starting on `weekStart`. */
export function loadWeek(weekStart: Date): Promise<CareActivity[]> {
  return api().listActivities(toIsoDate(weekStart), toIsoDate(addDays(weekStart, 6)));
}

export function scheduleActivity(command: ScheduleActivityCommand, caregiverName: string): Promise<CareActivity> {
  if (Object.keys(command.validate()).length > 0) return Promise.reject(new Error('validation_failed'));
  return api().scheduleActivity(command, caregiverName);
}

export const completeActivity = (activityId: string) => api().completeActivity(activityId);
export const cancelActivity = (activityId: string) => api().cancelActivity(activityId);

/** Monday of the week containing `date`. */
export function startOfWeek(date: Date): Date {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return addDays(start, -((start.getDay() + 6) % 7));
}
