/** Occurrence states supported by Assistance. */
export const OCCURRENCE_STATUSES = [
  'SCHEDULED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'MISSED',
] as const;

export type OccurrenceStatus = (typeof OCCURRENCE_STATUSES)[number];

/** Care activity types supported by Assistance. */
export const CARE_ACTIVITY_TYPES = [
  'MEDICATION',
  'BATH',
  'MEAL',
  'EXERCISE',
  'THERAPY',
  'APPOINTMENT',
  'OTHER',
] as const;

export type CareActivityType = (typeof CARE_ACTIVITY_TYPES)[number];

export interface HomePersonName {
  readonly firstName: string;
  readonly lastName: string;
}

export interface HomeAssistedPerson {
  readonly id: number;
  readonly name: HomePersonName;
}

export interface HomeGreeting {
  readonly name: HomePersonName;
}

export interface HomeTimeRange {
  readonly start: string;
  readonly end: string;
}

export interface HomeAgendaItem {
  readonly careActivityId: number;
  readonly assignmentId: number;
  readonly title: string;
  readonly type: CareActivityType;
  readonly date: string;
  readonly timeRange: HomeTimeRange;
  readonly caregiverId: number | null;
  readonly recurring: boolean;
  readonly status: OccurrenceStatus;
  readonly responsibleName: string;
  readonly description: string | null;
}

export interface HomeDeviceAlert {
  readonly deviceId: number;
  readonly title: string;
  readonly detail: string;
  readonly extraSituations: number;
  /** Where "Ver dispositivo" leads; the devices list when absent. */
  readonly route?: string;
}

export interface HomeUpcomingEvent {
  readonly id: number;
  readonly title: string;
  readonly date: string;
  readonly timeRange: HomeTimeRange;
  readonly technicianName: string | null;
  /** Where "Ver seguimiento" leads; the incidents list when absent. */
  readonly route?: string;
}

export interface HomeSharedOptionalData {
  readonly unreadNotifications?: number;
  readonly householdLabel?: string;
}

export interface PrincipalHomeSummary extends HomeSharedOptionalData {
  readonly greeting: HomeGreeting;
  readonly assistedPersons: readonly HomeAssistedPerson[];
  readonly selectedAssistedPersonId: number | null;
  readonly todayAgenda: readonly HomeAgendaItem[];
  readonly deviceAlert?: HomeDeviceAlert;
  readonly upcomingEvent?: HomeUpcomingEvent;
}

export interface GuestHomeSummary extends HomeSharedOptionalData {
  readonly greeting: HomeGreeting;
  readonly assistedPersons: readonly HomeAssistedPerson[];
  readonly selectedAssistedPersonId: number | null;
  readonly nextActivity: HomeAgendaItem | null;
}

export type HomeSummary = PrincipalHomeSummary | GuestHomeSummary;

/** Joins the name parts that the UI needs to render. */
export function formatPersonName(name: HomePersonName): string {
  return [name.firstName, name.lastName]
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .join(' ');
}

/** Finds the selected person, falling back to the first registered person. */
export function findAssistedPerson(
  persons: readonly HomeAssistedPerson[],
  selectedId: number | null,
): HomeAssistedPerson | null {
  return persons.find((person) => person.id === selectedId) ?? persons[0] ?? null;
}
