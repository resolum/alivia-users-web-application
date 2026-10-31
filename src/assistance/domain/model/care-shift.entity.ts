import type { BaseEntity } from '@/shared/domain/model/base-entity.ts';

export interface CareShiftProps {
  readonly id: string;
  readonly caregiverId: string;
  readonly caregiverName: string;
  /** ISO instants; a shift may cross midnight. */
  readonly startsAt: string;
  readonly endsAt: string;
  readonly notes: string;
}

/** A period in which one caregiver holds the main responsibility. Backend equivalent: CareShift. */
export class CareShift implements BaseEntity {
  readonly id: string;
  readonly caregiverId: string;
  readonly caregiverName: string;
  readonly startsAt: string;
  readonly endsAt: string;
  readonly notes: string;

  constructor(props: CareShiftProps) {
    this.id = props.id;
    this.caregiverId = props.caregiverId;
    this.caregiverName = props.caregiverName;
    this.startsAt = props.startsAt;
    this.endsAt = props.endsAt;
    this.notes = props.notes;
  }

  get start(): Date {
    return new Date(this.startsAt);
  }

  get end(): Date {
    return new Date(this.endsAt);
  }

  covers(at: Date): boolean {
    return this.start <= at && at < this.end;
  }

  overlaps(start: Date, end: Date): boolean {
    return this.start < end && start < this.end;
  }
}

/** The shift running at `at`, if any. */
export function shiftAt(shifts: readonly CareShift[], at: Date): CareShift | undefined {
  return shifts.find((shift) => shift.covers(at));
}

/** The first shift that starts once `shift` ends, which is who takes over. */
export function nextShiftAfter(shifts: readonly CareShift[], shift: CareShift): CareShift | undefined {
  return [...shifts]
    .filter((candidate) => candidate.id !== shift.id && candidate.start >= shift.end)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0];
}

export type ShiftConflictKind = 'same_caregiver' | 'period_taken';

export interface ShiftConflict {
  readonly kind: ShiftConflictKind;
  readonly shift: CareShift;
}

/**
 * Responsibilities that coincide with a proposed shift: the caregiver already
 * works then, or someone else is already in charge of part of that period.
 */
export function shiftConflicts(
  candidate: { readonly id: string | null; readonly caregiverId: string; readonly start: Date; readonly end: Date },
  shifts: readonly CareShift[],
): ShiftConflict[] {
  return shifts
    .filter((shift) => shift.id !== candidate.id && shift.overlaps(candidate.start, candidate.end))
    .map((shift) => ({ kind: shift.caregiverId === candidate.caregiverId ? 'same_caregiver' : 'period_taken', shift }));
}
