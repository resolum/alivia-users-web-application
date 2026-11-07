import { BaseApi } from '@/shared/infrastructure/base-api.ts';
import { CareActivity, type ActivityRecordStatus, type ActivityType } from '../domain/model/care-activity.entity.ts';
import { MedicationAdministration, type AdministrationResult } from '../domain/model/medication-administration.entity.ts';
import { AssistanceApiError } from './assistance-api-error.ts';

/** Backend equivalent: AgendaOccurrenceResource (GET /care-agenda). */
export interface AgendaOccurrenceResource {
  readonly activity: { readonly id: number; readonly title: string; readonly type: string };
  readonly assignmentId: number;
  readonly assistedPerson: { readonly id: number; readonly name: string };
  readonly date: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly startsAt: string;
  readonly endsAt: string;
  readonly responsible: { readonly id: number; readonly personProfileId: number; readonly name: string; readonly email: string } | null;
  readonly recurring: boolean;
  readonly status: string;
  readonly priority: string;
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
const AGENDA_PATH = import.meta.env.VITE_CARE_AGENDA_ENDPOINT_PATH ?? 'care-agenda';
const ADMINISTRATIONS_PATH = import.meta.env.VITE_MEDICATION_ADMINISTRATIONS_ENDPOINT_PATH ?? 'medication-administrations';
const OUTCOMES_PATH =
  import.meta.env.VITE_MEDICATION_OUTCOMES_ENDPOINT_PATH ?? 'medication-administrations/{administrationId}/outcomes';

/** True when the environment points the agenda at the backend. */
export const isCareAgendaConfigured = () => Boolean(import.meta.env.VITE_CARE_AGENDA_ENDPOINT_PATH);

const TYPES: Readonly<Record<string, ActivityType>> = {
  MEDICATION: 'medication',
  BATH: 'hygiene',
  MEAL: 'nutrition',
  EXERCISE: 'mobility',
  THERAPY: 'mobility',
  APPOINTMENT: 'social',
  OTHER: 'leisure',
};

// MISSED stays scheduled: the entity derives "overdue" from the clock.
const STATUSES: Readonly<Record<string, ActivityRecordStatus>> = {
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  OMITTED: 'cancelled',
};

/** `{assignmentId}-{yyyyMMdd}`, the same id the medication administrations use. */
export const occurrenceId = (item: Pick<AgendaOccurrenceResource, 'assignmentId' | 'date'>) =>
  `${item.assignmentId}-${item.date.replaceAll('-', '')}`;

export function toCareActivity(item: AgendaOccurrenceResource): CareActivity {
  const minutes = Math.round((new Date(item.endsAt).getTime() - new Date(item.startsAt).getTime()) / 60_000);
  return new CareActivity({
    id: occurrenceId(item),
    title: item.activity.title,
    type: TYPES[item.activity.type] ?? 'leisure',
    date: item.date,
    time: item.startTime.slice(0, 5),
    durationMinutes: minutes > 0 ? minutes : null,
    // shortcut: the agenda only says whether it repeats, not how; shown as daily until it exposes the rule.
    repetition: item.recurring ? 'daily' : 'none',
    caregiverId: item.responsible ? String(item.responsible.id) : '',
    caregiverName: item.responsible?.name ?? '',
    reminderMinutes: null,
    notes: '',
    tag: null,
    status: STATUSES[item.status] ?? 'scheduled',
    completedAt: null,
    completedByName: null,
  });
}

function toError(status: number): AssistanceApiError {
  if (status === 403) return new AssistanceApiError('forbidden');
  if (status === 404) return new AssistanceApiError('not_found');
  if (status === 409) return new AssistanceApiError('already_recorded');
  return new AssistanceApiError('conflict');
}

async function send(url: string, init: RequestInit): Promise<Response> {
  const response = await BaseApi.request(url, init, { authenticated: true });
  if (!response.ok) throw toError(response.status);
  return response;
}

/** Backend equivalent: MedicationAdministrationResource. */
export interface MedicationAdministrationResource {
  readonly administrationId: string;
  readonly medication: string;
  readonly assistedPerson: { readonly id: number; readonly name: string };
  readonly date: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly responsible: { readonly type: string; readonly id: number; readonly name: string } | null;
  readonly status: string;
  readonly outcome: {
    readonly result: string;
    readonly occurredAt?: string | null;
    readonly reason?: string | null;
  } | null;
}

const RESULTS: Readonly<Record<string, AdministrationResult>> = { ADMINISTERED: 'given', OMITTED: 'omitted' };

export function toAdministration(resource: MedicationAdministrationResource): MedicationAdministration {
  return new MedicationAdministration({
    id: resource.administrationId,
    scheduleId: resource.administrationId.split('-')[0],
    // The backend name already carries the strength, e.g. "Losartan 50 mg".
    medication: resource.medication,
    dose: '',
    scheduledAt: new Date(`${resource.date}T${resource.startTime}`).toISOString(),
    responsibleId: resource.responsible ? String(resource.responsible.id) : '',
    responsibleName: resource.responsible?.name ?? '',
    result: resource.outcome ? (RESULTS[resource.outcome.result] ?? null) : null,
    recordedAt: resource.outcome?.occurredAt ? new Date(resource.outcome.occurredAt).toISOString() : null,
    recordedByName: null,
    reason: resource.outcome?.reason ?? null,
    alertedAt: null,
  });
}

const administrationUrl = (id: string) => `${BASE_URL}/${ADMINISTRATIONS_PATH}/${encodeURIComponent(id)}`;

async function agenda(from: string, to: string): Promise<AgendaOccurrenceResource[]> {
  const query = new URLSearchParams({ from, to });
  const response = await send(`${BASE_URL}/${AGENDA_PATH}?${query}`, { method: 'GET' });
  return (await response.json()) as AgendaOccurrenceResource[];
}

async function postOutcome(administrationId: string, body: object): Promise<MedicationAdministrationResource> {
  const url = `${BASE_URL}/${OUTCOMES_PATH.replace('{administrationId}', encodeURIComponent(administrationId))}`;
  const response = await send(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // The backend wants local time without offset, like the agenda it returns.
    body: JSON.stringify({ occurredAt: localDateTime(new Date()), ...body }),
  });
  return (await response.json()) as MedicationAdministrationResource;
}

export const careAgendaApi = {
  /** Occurrences visible to the signed-in user between two inclusive ISO dates. */
  async list(from: string, to: string): Promise<CareActivity[]> {
    return (await agenda(from, to)).map(toCareActivity);
  },

  /** Records that the dose of a medication occurrence was given; one outcome per administration. */
  async recordAdministered(administrationId: string): Promise<void> {
    await postOutcome(administrationId, { result: 'ADMINISTERED' });
  },

  async getAdministration(administrationId: string): Promise<MedicationAdministration> {
    const response = await send(administrationUrl(administrationId), { method: 'GET' });
    return toAdministration((await response.json()) as MedicationAdministrationResource);
  },

  /**
   * Doses are the MEDICATION occurrences of the agenda, each read in full.
   * shortcut: one request per dose; fine for a few daily doses, batch it if the API adds a list.
   */
  async listAdministrations(from: string, to: string): Promise<MedicationAdministration[]> {
    const doses = (await agenda(from, to)).filter((item) => item.activity.type === 'MEDICATION');
    return Promise.all(doses.map((item) => careAgendaApi.getAdministration(occurrenceId(item))));
  },

  /** A 409 means it already had an outcome; that existing record travels with the error. */
  async recordOutcome(administrationId: string, result: AdministrationResult, reason: string): Promise<MedicationAdministration> {
    try {
      const body = result === 'given' ? { result: 'ADMINISTERED' } : { result: 'OMITTED', reason };
      return toAdministration(await postOutcome(administrationId, body));
    } catch (error) {
      if (error instanceof AssistanceApiError && error.code === 'already_recorded') {
        throw new AssistanceApiError('already_recorded', await careAgendaApi.getAdministration(administrationId));
      }
      throw error;
    }
  },
};

function localDateTime(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
