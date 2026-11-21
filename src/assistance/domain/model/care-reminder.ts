import type { CareActivity } from './care-activity.entity.ts';
import type { CareShift } from './care-shift.entity.ts';
import type { MedicationAdministration } from './medication-administration.entity.ts';

/** Lead times used when the item does not set its own. */
export const SHIFT_REMINDER_MINUTES = 30;
export const ACTIVITY_REMINDER_MINUTES = 15;
export const DOSE_REMINDER_MINUTES = 15;

export type ReminderKind = 'shift' | 'activity' | 'medication';

export interface CareReminder {
  /** Stable per item and start, so the same reminder is never delivered twice. */
  readonly id: string;
  readonly kind: ReminderKind;
  readonly title: string;
  readonly body: string;
  readonly route: string;
  readonly startsAt: Date;
}

export interface ReminderSources {
  readonly caregiverId: string;
  readonly assistedPersonName: string;
  readonly shifts: readonly CareShift[];
  readonly activities: readonly CareActivity[];
  readonly doses: readonly MedicationAdministration[];
}

const clock = (date: Date) => date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

/**
 * Reminders the caregiver should have now. One is due from its lead time until the item starts;
 * once it starts the reminder is no longer pertinent, so one held back offline is dropped.
 */
export function dueReminders(sources: ReminderSources, now: Date): CareReminder[] {
  const { caregiverId, assistedPersonName: person } = sources;
  const due = (startsAt: Date, lead: number) => now < startsAt && now.getTime() >= startsAt.getTime() - lead * 60_000;

  const shifts = sources.shifts
    .filter((shift) => shift.caregiverId === caregiverId && due(shift.start, SHIFT_REMINDER_MINUTES))
    .map((shift) => ({
      id: `reminder-shift-${shift.id}`,
      kind: 'shift' as const,
      title: 'Turno próximo',
      body: `Tu turno con ${person} es de ${clock(shift.start)} a ${clock(shift.end)}.`,
      route: '/shifts',
      startsAt: shift.start,
    }));

  const activities = sources.activities
    .filter(
      (activity) =>
        activity.caregiverId === caregiverId &&
        activity.status === 'scheduled' &&
        due(activity.startsAt, activity.reminderMinutes ?? ACTIVITY_REMINDER_MINUTES),
    )
    .map((activity) => ({
      id: `reminder-activity-${activity.id}-${activity.date}`,
      kind: 'activity' as const,
      title: 'Actividad próxima',
      body: `${activity.title} con ${person} a las ${clock(activity.startsAt)}.`,
      route: '/activities',
      startsAt: activity.startsAt,
    }));

  // Names the dose and the time only: a reminder never suggests changing the indication.
  const doses = sources.doses
    .filter((dose) => dose.responsibleId === caregiverId && !dose.isFinal && due(new Date(dose.scheduledAt), DOSE_REMINDER_MINUTES))
    .map((dose) => ({
      id: `reminder-dose-${dose.id}`,
      kind: 'medication' as const,
      title: 'Medicamento próximo',
      body: `${[dose.medication, dose.dose].filter(Boolean).join(' ')} para ${person} a las ${clock(new Date(dose.scheduledAt))}.`,
      route: '/medications',
      startsAt: new Date(dose.scheduledAt),
    }));

  return [...shifts, ...activities, ...doses];
}
