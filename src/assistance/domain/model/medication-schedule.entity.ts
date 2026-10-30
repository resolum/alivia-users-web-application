import type { BaseEntity } from '@/shared/domain/model/base-entity.ts';

export const FREQUENCIES = ['daily', 'every_other_day', 'weekly'] as const;
export type Frequency = (typeof FREQUENCIES)[number];

/**
 * One version of the plan. A new indication adds a revision from its effective
 * date instead of overwriting, so the earlier plan stays in the history. The
 * latest recorded revision wins from its date on, even over older future ones.
 */
export interface MedicationRevision {
  /** Local yyyy-mm-dd from which this version applies. */
  readonly effectiveFrom: string;
  readonly dose: string;
  /** Local HH:mm, sorted. */
  readonly times: readonly string[];
  readonly frequency: Frequency;
  /** Prescription or indication that backs this version ("Receta Dr. Paredes, 12/10/2026"). */
  readonly indicationRef: string;
  readonly recordedAt: string;
  readonly recordedByName: string;
}

export interface MedicationSuspension {
  readonly from: string;
  /** Authorized source of the suspension. */
  readonly source: string;
  readonly recordedAt: string;
  readonly recordedByName: string;
}

export interface MedicationScheduleProps {
  readonly id: string;
  readonly medication: string;
  readonly assistedPersonId: string;
  readonly caregiverId: string;
  readonly caregiverName: string;
  readonly startDate: string;
  readonly endDate: string | null;
  readonly revisions: readonly MedicationRevision[];
  readonly suspension: MedicationSuspension | null;
}

const DAY = 86_400_000;
const dayNumber = (iso: string) => Math.round(new Date(`${iso}T12:00:00`).getTime() / DAY);

/** Coordinated administration of a previously indicated medication. Backend equivalent: MedicationSchedule. */
export class MedicationSchedule implements BaseEntity {
  readonly id: string;
  readonly medication: string;
  readonly assistedPersonId: string;
  readonly caregiverId: string;
  readonly caregiverName: string;
  readonly startDate: string;
  readonly endDate: string | null;
  readonly revisions: readonly MedicationRevision[];
  readonly suspension: MedicationSuspension | null;

  constructor(props: MedicationScheduleProps) {
    this.id = props.id;
    this.medication = props.medication;
    this.assistedPersonId = props.assistedPersonId;
    this.caregiverId = props.caregiverId;
    this.caregiverName = props.caregiverName;
    this.startDate = props.startDate;
    this.endDate = props.endDate;
    // In the order they were recorded.
    this.revisions = [...props.revisions].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
    this.suspension = props.suspension;
  }

  /** The version in force on `date`: the last one recorded among those already effective. */
  revisionOn(date: string): MedicationRevision {
    const first = [...this.revisions].sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom))[0];
    return this.revisions.filter((revision) => revision.effectiveFrom <= date).at(-1) ?? first;
  }

  get latest(): MedicationRevision {
    return this.revisions[this.revisions.length - 1];
  }

  isSuspendedOn(date: string): boolean {
    return this.suspension !== null && date >= this.suspension.from;
  }

  /** Times due on `date`; empty when the plan does not apply that day. */
  dosesOn(date: string): readonly string[] {
    if (date < this.startDate || (this.endDate !== null && date > this.endDate) || this.isSuspendedOn(date)) return [];
    const revision = this.revisionOn(date);
    const elapsed = dayNumber(date) - dayNumber(this.startDate);
    if (revision.frequency === 'every_other_day' && elapsed % 2 !== 0) return [];
    if (revision.frequency === 'weekly' && elapsed % 7 !== 0) return [];
    return revision.times;
  }

  statusOn(date: string): 'active' | 'suspended' | 'finished' | 'upcoming' {
    if (this.isSuspendedOn(date)) return 'suspended';
    if (this.endDate !== null && date > this.endDate) return 'finished';
    if (date < this.startDate) return 'upcoming';
    return 'active';
  }
}
