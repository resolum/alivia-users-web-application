import type { BaseEntity } from '@/shared/domain/model/base-entity.ts';
import { nextShiftAfter, shiftAt, type CareShift } from './care-shift.entity.ts';

/**
 * pending: waiting for the next caregiver; declined: they cannot take it and a
 * substitute is needed; accepted / reassigned: someone confirmed the relief.
 */
export type HandoverStatus = 'pending' | 'declined' | 'accepted' | 'reassigned';

/** Minutes after the shift ends before an unconfirmed relief is escalated. */
export const ESCALATION_MINUTES = 30;

/** Minutes before a shift ends when its relief is opened, if nobody requested it yet. */
export const HANDOVER_LEAD_MINUTES = 60;

export interface HandoverProps {
  readonly id: string;
  readonly fromShiftId: string;
  readonly toShiftId: string;
  readonly fromCaregiverId: string;
  readonly fromCaregiverName: string;
  readonly toCaregiverId: string;
  readonly toCaregiverName: string;
  readonly status: HandoverStatus;
  readonly requestedAt: string;
  readonly respondedAt: string | null;
  /** Set once the principal caregiver was alerted about the coverage risk. */
  readonly escalatedAt: string | null;
  /** Snapshot of the outgoing shift taken when the relief was requested. */
  readonly attended: readonly string[];
  readonly pending: readonly string[];
  /** The incoming caregiver could not take it and `toCaregiver` is a proposed substitute. */
  readonly substitute?: boolean;
}

/** Relief between two consecutive shifts. Backend equivalent: Handover. */
export class Handover implements BaseEntity {
  readonly id: string;
  readonly fromShiftId: string;
  readonly toShiftId: string;
  readonly fromCaregiverId: string;
  readonly fromCaregiverName: string;
  readonly toCaregiverId: string;
  readonly toCaregiverName: string;
  readonly status: HandoverStatus;
  readonly requestedAt: string;
  readonly respondedAt: string | null;
  readonly escalatedAt: string | null;
  readonly attended: readonly string[];
  readonly pending: readonly string[];
  readonly substitute: boolean;

  constructor(props: HandoverProps) {
    this.id = props.id;
    this.fromShiftId = props.fromShiftId;
    this.toShiftId = props.toShiftId;
    this.fromCaregiverId = props.fromCaregiverId;
    this.fromCaregiverName = props.fromCaregiverName;
    this.toCaregiverId = props.toCaregiverId;
    this.toCaregiverName = props.toCaregiverName;
    this.status = props.status;
    this.requestedAt = props.requestedAt;
    this.respondedAt = props.respondedAt;
    this.escalatedAt = props.escalatedAt;
    this.attended = props.attended;
    this.pending = props.pending;
    this.substitute = props.substitute ?? false;
  }

  /** Nobody has confirmed the relief yet. */
  get isOpen(): boolean {
    return this.status === 'pending' || this.status === 'declined';
  }

  escalationDueAt(fromShiftEnd: Date): Date {
    return new Date(fromShiftEnd.getTime() + ESCALATION_MINUTES * 60_000);
  }

  needsEscalation(fromShiftEnd: Date, now: Date): boolean {
    return this.isOpen && this.escalatedAt === null && now >= this.escalationDueAt(fromShiftEnd);
  }
}

export interface Responsible {
  readonly caregiverId: string;
  readonly caregiverName: string;
  /** holdover: the shift ended but the relief is unconfirmed, so the outgoing caregiver keeps it. */
  readonly reason: 'shift' | 'holdover';
  readonly shift: CareShift;
}

/** The relief a shift needs next, when the following shift belongs to someone else. */
export function reliefFor(shifts: readonly CareShift[], shift: CareShift): CareShift | undefined {
  const next = nextShiftAfter(shifts, shift);
  return next && next.caregiverId !== shift.caregiverId ? next : undefined;
}

const lastEndedBy = (shifts: readonly CareShift[], at: Date) =>
  [...shifts].filter((shift) => shift.end <= at).sort((a, b) => b.endsAt.localeCompare(a.endsAt))[0];

/**
 * The shift whose caregiver really holds `shift`: a change of hands only counts
 * once someone accepted it, whether or not the relief was ever requested.
 */
function holderOf(shifts: readonly CareShift[], handovers: readonly Handover[], shift: CareShift): CareShift {
  const previous = lastEndedBy(shifts.filter((item) => item.id !== shift.id), shift.start);
  if (!previous || previous.caregiverId === shift.caregiverId) return shift;
  const confirmed = handovers.some((handover) => handover.toShiftId === shift.id && !handover.isOpen);
  return confirmed ? shift : holderOf(shifts, handovers, previous);
}

/**
 * Who is in charge at `at`. The responsibility only moves to the next shift
 * once its relief is confirmed, so the person is never left without a responsible.
 */
export function responsibleAt(shifts: readonly CareShift[], handovers: readonly Handover[], at: Date): Responsible | null {
  const running = shiftAt(shifts, at);
  // Between shifts, whoever ended last keeps it until the next caregiver confirms.
  const ended = running ? undefined : lastEndedBy(shifts, at);
  const target = running ?? (ended && reliefFor(shifts, ended) ? ended : undefined);
  if (!target) return null;
  const holder = holderOf(shifts, handovers, target);
  const reason = holder === running ? 'shift' : 'holdover';
  return { caregiverId: holder.caregiverId, caregiverName: holder.caregiverName, reason, shift: holder };
}
