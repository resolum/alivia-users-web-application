import type { BaseEntity } from '@/shared/domain/model/base-entity.ts';
import { toIsoDate } from '@/shared/domain/model/valueobjects/relative-time.ts';
import type { MedicationSchedule } from './medication-schedule.entity.ts';

/** Minutes after the scheduled time in which a dose counts as on time. */
export const ADMINISTRATION_WINDOW_MINUTES = 60;

export type AdministrationResult = 'given' | 'omitted';

/** pending: inside its window; overdue: the window passed without a result. */
export type AdministrationState = 'pending' | 'overdue' | AdministrationResult;

export interface AdministrationProps {
  /** `${scheduleId}@${scheduledAt}`, so a dose can only have one record. */
  readonly id: string;
  readonly scheduleId: string;
  readonly medication: string;
  readonly dose: string;
  readonly scheduledAt: string;
  readonly responsibleId: string;
  readonly responsibleName: string;
  readonly result: AdministrationResult | null;
  /** Real moment the caregiver reported it, kept even when late. */
  readonly recordedAt: string | null;
  readonly recordedByName: string | null;
  readonly reason: string | null;
  /** When the overdue alert was raised, so it is raised only once. */
  readonly alertedAt: string | null;
}

/** One scheduled dose and its outcome. Backend equivalent: MedicationAdministration. */
export class MedicationAdministration implements BaseEntity {
  readonly id: string;
  readonly scheduleId: string;
  readonly medication: string;
  readonly dose: string;
  readonly scheduledAt: string;
  readonly responsibleId: string;
  readonly responsibleName: string;
  readonly result: AdministrationResult | null;
  readonly recordedAt: string | null;
  readonly recordedByName: string | null;
  readonly reason: string | null;
  readonly alertedAt: string | null;

  constructor(props: AdministrationProps) {
    this.id = props.id;
    this.scheduleId = props.scheduleId;
    this.medication = props.medication;
    this.dose = props.dose;
    this.scheduledAt = props.scheduledAt;
    this.responsibleId = props.responsibleId;
    this.responsibleName = props.responsibleName;
    this.result = props.result;
    this.recordedAt = props.recordedAt;
    this.recordedByName = props.recordedByName;
    this.reason = props.reason;
    this.alertedAt = props.alertedAt;
  }

  get windowEndsAt(): Date {
    return new Date(new Date(this.scheduledAt).getTime() + ADMINISTRATION_WINDOW_MINUTES * 60_000);
  }

  get isFinal(): boolean {
    return this.result !== null;
  }

  /** Reported after its window closed. */
  get isLate(): boolean {
    return this.recordedAt !== null && new Date(this.recordedAt) > this.windowEndsAt;
  }

  stateAt(now: Date): AdministrationState {
    if (this.result) return this.result;
    return now > this.windowEndsAt ? 'overdue' : 'pending';
  }

  toProps(): AdministrationProps {
    return { ...this };
  }
}

export const administrationId = (scheduleId: string, scheduledAt: string) => `${scheduleId}@${scheduledAt}`;

/** Doses the schedules call for on `date`, before any result is recorded. */
export function dosesFor(schedules: readonly MedicationSchedule[], date: Date): AdministrationProps[] {
  const iso = toIsoDate(date);
  return schedules.flatMap((schedule) =>
    schedule.dosesOn(iso).map((time) => {
      const scheduledAt = new Date(`${iso}T${time}:00`).toISOString();
      return {
        id: administrationId(schedule.id, scheduledAt),
        scheduleId: schedule.id,
        medication: schedule.medication,
        dose: schedule.revisionOn(iso).dose,
        scheduledAt,
        responsibleId: schedule.caregiverId,
        responsibleName: schedule.caregiverName,
        result: null,
        recordedAt: null,
        recordedByName: null,
        reason: null,
        alertedAt: null,
      };
    }),
  );
}

export type RecordAdministrationError = 'reason_required';

/** Confirm or omit a dose; an omission must say why. */
export class RecordAdministrationCommand {
  readonly administrationId: string;
  readonly result: AdministrationResult;
  readonly reason: string;

  constructor(administrationId: string, result: AdministrationResult, reason = '') {
    this.administrationId = administrationId;
    this.result = result;
    this.reason = reason.trim();
  }

  validate(): RecordAdministrationError | null {
    return this.result === 'omitted' && this.reason === '' ? 'reason_required' : null;
  }
}
