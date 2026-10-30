import type { ActivityType, Repetition } from './care-activity.entity.ts';

export type ActivityField = 'title' | 'type' | 'date' | 'time' | 'caregiverId' | 'notes';
export type ActivityFieldError = 'required' | 'too_long' | 'in_past';

export const NOTES_MAX = 250;
const TITLE_MAX = 80;

export interface ScheduleActivityValues {
  readonly title: string;
  readonly type: ActivityType | '';
  readonly date: string;
  readonly time: string;
  readonly durationMinutes: number | null;
  readonly repetition: Repetition;
  readonly caregiverId: string;
  readonly reminderMinutes: number | null;
  readonly notes: string;
}

/** Create or edit a care activity. `activityId` is null when scheduling a new one. */
export class ScheduleActivityCommand {
  readonly activityId: string | null;
  readonly values: ScheduleActivityValues;

  constructor(activityId: string | null, values: ScheduleActivityValues) {
    this.activityId = activityId;
    this.values = { ...values, title: values.title.trim(), notes: values.notes.trim() };
  }

  validate(now: Date = new Date()): Partial<Record<ActivityField, ActivityFieldError>> {
    const { title, type, date, time, caregiverId, notes } = this.values;
    const errors: Partial<Record<ActivityField, ActivityFieldError>> = {};
    if (title === '') errors.title = 'required';
    else if (title.length > TITLE_MAX) errors.title = 'too_long';
    if (type === '') errors.type = 'required';
    if (date === '') errors.date = 'required';
    if (time === '') errors.time = 'required';
    if (caregiverId === '') errors.caregiverId = 'required';
    if (notes.length > NOTES_MAX) errors.notes = 'too_long';
    // Editing keeps past activities editable (e.g. fixing notes); new ones must be ahead.
    if (this.activityId === null && date && time && new Date(`${date}T${time}:00`) < now) {
      errors.time = 'in_past';
    }
    return errors;
  }
}
