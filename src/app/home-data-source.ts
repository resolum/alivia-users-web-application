import { loadAssistedPerson, loadWeek, type CareActivity } from '@/assistance/index.ts';
import { iamStore } from '@/iam/index.ts';
import { loadIncidents } from '@/operations/index.ts';
import { loadProfile } from '@/profiles/index.ts';
import { toIsoDate } from '@/shared/domain/model/valueobjects/relative-time.ts';
import type { HomeDataSource } from '@/shared/presentation/views/home/home.data-source.ts';
import type {
  CareActivityType,
  HomeAgendaItem,
  HomeDeviceAlert,
  HomeGreeting,
  HomeUpcomingEvent,
  OccurrenceStatus,
} from '@/shared/presentation/views/home/home.view-model.ts';
import { loadHomeDevices } from '@/tracking/index.ts';

const TYPE: Record<CareActivity['type'], CareActivityType> = {
  hygiene: 'BATH',
  medication: 'MEDICATION',
  nutrition: 'MEAL',
  hydration: 'MEAL',
  mobility: 'EXERCISE',
  leisure: 'OTHER',
  social: 'APPOINTMENT',
};

const hhmm = (date: Date) => `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

export function statusOf(activity: CareActivity, now: Date): OccurrenceStatus {
  const state = activity.stateAt(now);
  if (state === 'completed') return 'COMPLETED';
  if (state === 'cancelled') return 'CANCELLED';
  if (state === 'overdue') return 'MISSED';
  return activity.startsAt <= now ? 'IN_PROGRESS' : 'SCHEDULED';
}

function toAgendaItem(activity: CareActivity, index: number, now: Date): HomeAgendaItem {
  const end = new Date(activity.startsAt.getTime() + activity.span * 60_000);
  return {
    careActivityId: index + 1,
    assignmentId: index + 1,
    title: activity.title,
    type: TYPE[activity.type],
    date: activity.date,
    timeRange: { start: activity.time, end: hhmm(end) },
    caregiverId: null,
    recurring: activity.repetition !== 'none',
    status: statusOf(activity, now),
    // The timeline shows the first name only, as in the design.
    responsibleName: activity.caregiverName.split(' ')[0],
    description: activity.notes || null,
  };
}

async function greeting(): Promise<HomeGreeting> {
  const profileId = iamStore.getState().user?.profileId;
  if (!profileId) return { name: { firstName: '', lastName: '' } };
  const profile = await loadProfile(profileId).catch(() => null);
  return { name: { firstName: profile?.firstName.split(' ')[0] ?? '', lastName: profile?.lastName ?? '' } };
}

async function deviceAlert(): Promise<HomeDeviceAlert | undefined> {
  const { devices } = await loadHomeDevices();
  const flagged = devices.filter((device) => device.health !== 'operational');
  const [first] = flagged;
  if (!first) return undefined;
  const lowBattery = first.health === 'attention';
  return {
    deviceId: 0,
    title: lowBattery ? `${first.name} con batería baja` : `${first.name} sin conexión`,
    detail: lowBattery ? `${first.batteryLevel} % restante · ${first.roomName}` : first.roomName,
    extraSituations: flagged.length - 1,
    route: `/devices?device=${first.id}`,
  };
}

async function upcomingVisit(now: Date): Promise<HomeUpcomingEvent | undefined> {
  const next = (await loadIncidents())
    .filter((incident) => !incident.isResolved && incident.visit && new Date(incident.visit.end) > now)
    .sort((a, b) => (a.visit?.start ?? '').localeCompare(b.visit?.start ?? ''))[0];
  if (!next?.visit) return undefined;
  const start = new Date(next.visit.start);
  return {
    id: 0,
    title: 'Visita por incidencia',
    date: toIsoDate(start),
    timeRange: { start: hhmm(start), end: hhmm(new Date(next.visit.end)) },
    technicianName: next.visit.technicianName,
    route: `/incidents/${next.id}`,
  };
}

/** Optional cards must not take the whole Home down when their context fails. */
const optional = <T,>(promise: Promise<T>) => promise.catch(() => undefined);

/**
 * Home read model composed from the bounded contexts. The agenda and the
 * assisted person are required; alerts and the next visit are best effort.
 */
export const composedHomeDataSource: HomeDataSource = {
  async getPrincipalSummary() {
    const now = new Date();
    const today = toIsoDate(now);
    const [name, person, week, alert, event] = await Promise.all([
      greeting(),
      loadAssistedPerson(),
      loadWeek(now),
      optional(deviceAlert()),
      optional(upcomingVisit(now)),
    ]);
    const todayAgenda = week
      .filter((activity) => activity.date === today && activity.status !== 'cancelled')
      .sort((a, b) => a.startMinute - b.startMinute)
      .map((activity, index) => toAgendaItem(activity, index, now));
    return {
      greeting: name,
      assistedPersons: [{ id: 1, name: { firstName: person.firstName, lastName: '' } }],
      selectedAssistedPersonId: 1,
      todayAgenda,
      deviceAlert: alert,
      upcomingEvent: event,
    };
  },

  async getGuestSummary() {
    const now = new Date();
    const [name, person, week] = await Promise.all([greeting(), loadAssistedPerson(), loadWeek(now)]);
    // shortcut: IAM accounts are not linked to caregivers yet, so the guest sees the household's next activity, not only theirs.
    const next = week
      .filter((activity) => activity.status === 'scheduled' && activity.startsAt.getTime() + activity.span * 60_000 > now.getTime())
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())[0];
    return {
      greeting: name,
      assistedPersons: [{ id: 1, name: { firstName: person.firstName, lastName: '' } }],
      selectedAssistedPersonId: 1,
      nextActivity: next ? toAgendaItem(next, 0, now) : null,
    };
  },
};
