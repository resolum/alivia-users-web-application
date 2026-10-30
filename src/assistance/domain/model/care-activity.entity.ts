import type { BaseEntity } from '@/shared/domain/model/base-entity.ts';

export const ACTIVITY_TYPES = [
  'hygiene',
  'medication',
  'nutrition',
  'hydration',
  'mobility',
  'leisure',
  'social',
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const REPETITIONS = ['none', 'daily', 'weekdays', 'weekly'] as const;
export type Repetition = (typeof REPETITIONS)[number];

/** What is stored; overdue and pending are derived from the clock. */
export type ActivityRecordStatus = 'scheduled' | 'completed' | 'cancelled';

/** What the caregiver sees. */
export type ActivityState = 'completed' | 'cancelled' | 'overdue' | 'pending' | 'scheduled';

export interface CareActivityProps {
  readonly id: string;
  readonly title: string;
  readonly type: ActivityType;
  /** Local yyyy-mm-dd. */
  readonly date: string;
  /** Local HH:mm. */
  readonly time: string;
  readonly durationMinutes: number | null;
  readonly repetition: Repetition;
  readonly caregiverId: string;
  readonly caregiverName: string;
  readonly reminderMinutes: number | null;
  readonly notes: string;
  /** Short context printed next to the title, e.g. "Previamente indicado". */
  readonly tag: string | null;
  readonly status: ActivityRecordStatus;
  readonly completedAt: string | null;
  /** Who reported the activity as attended; may differ from the assigned caregiver. */
  readonly completedByName: string | null;
}

/** A care task or reminder for the assisted person. Backend equivalent: CareActivity / AgendaItem. */
export class CareActivity implements BaseEntity {
  readonly id: string;
  readonly title: string;
  readonly type: ActivityType;
  readonly date: string;
  readonly time: string;
  readonly durationMinutes: number | null;
  readonly repetition: Repetition;
  readonly caregiverId: string;
  readonly caregiverName: string;
  readonly reminderMinutes: number | null;
  readonly notes: string;
  readonly tag: string | null;
  readonly status: ActivityRecordStatus;
  readonly completedAt: string | null;
  readonly completedByName: string | null;

  constructor(props: CareActivityProps) {
    this.id = props.id;
    this.title = props.title;
    this.type = props.type;
    this.date = props.date;
    this.time = props.time;
    this.durationMinutes = props.durationMinutes;
    this.repetition = props.repetition;
    this.caregiverId = props.caregiverId;
    this.caregiverName = props.caregiverName;
    this.reminderMinutes = props.reminderMinutes;
    this.notes = props.notes;
    this.tag = props.tag;
    this.status = props.status;
    this.completedAt = props.completedAt;
    this.completedByName = props.completedByName ?? null;
  }

  get startsAt(): Date {
    return new Date(`${this.date}T${this.time}:00`);
  }

  get startMinute(): number {
    const [hours, minutes] = this.time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /** Minutes the activity occupies in the agenda; untimed ones take half an hour. */
  get span(): number {
    return this.durationMinutes ?? 30;
  }

  stateAt(now: Date): ActivityState {
    if (this.status !== 'scheduled') return this.status;
    const end = this.startsAt.getTime() + this.span * 60_000;
    if (end < now.getTime()) return 'overdue';
    const sameDay = this.startsAt.toDateString() === now.toDateString();
    return sameDay ? 'pending' : 'scheduled';
  }

  with(changes: Partial<CareActivityProps>): CareActivity {
    return new CareActivity({ ...this.toProps(), ...changes });
  }

  toProps(): CareActivityProps {
    return { ...this };
  }
}

export type DayPeriod = 'morning' | 'afternoon' | 'night';

export function periodOf(activity: CareActivity): DayPeriod {
  const hour = Math.floor(activity.startMinute / 60);
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'night';
}

/**
 * Groups activities whose time windows overlap on the same day, so the week
 * grid can lay them side by side and flag the clash.
 */
export function overlapGroups(
  activities: readonly CareActivity[],
  spanOf: (activity: CareActivity) => number = (activity) => activity.span,
): CareActivity[][] {
  const sorted = [...activities].sort((a, b) => a.startMinute - b.startMinute);
  const groups: CareActivity[][] = [];
  let groupEnd = -1;
  for (const activity of sorted) {
    const current = groups.at(-1);
    if (current && activity.startMinute < groupEnd) {
      current.push(activity);
      groupEnd = Math.max(groupEnd, activity.startMinute + spanOf(activity));
    } else {
      groups.push([activity]);
      groupEnd = activity.startMinute + spanOf(activity);
    }
  }
  return groups;
}

/** Ids of active activities that share time with another one the same day. */
export function clashingIds(activities: readonly CareActivity[]): Set<string> {
  const live = activities.filter((activity) => activity.status !== 'cancelled');
  const byDay = new Map<string, CareActivity[]>();
  for (const activity of live) byDay.set(activity.date, [...(byDay.get(activity.date) ?? []), activity]);
  const ids = new Set<string>();
  for (const day of byDay.values()) {
    for (const group of overlapGroups(day)) {
      if (group.length > 1) group.forEach((activity) => ids.add(activity.id));
    }
  }
  return ids;
}
