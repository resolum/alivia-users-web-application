import { addDays, toIsoDate } from '@/shared/domain/model/valueobjects/relative-time.ts';
import { respond } from '@/shared/infrastructure/local-collection.ts';
import type { AssignShiftCommand } from '../domain/model/assign-shift.command.ts';
import { CareShift, shiftConflicts } from '../domain/model/care-shift.entity.ts';
import type { Caregiver } from '../domain/model/caregiver.entity.ts';
import { Handover } from '../domain/model/handover.entity.ts';
import {
  dosesFor,
  MedicationAdministration,
  type RecordAdministrationCommand,
} from '../domain/model/medication-administration.entity.ts';
import { MedicationSchedule, type MedicationScheduleProps } from '../domain/model/medication-schedule.entity.ts';
import type {
  ScheduleMedicationCommand,
  SuspendMedicationCommand,
  UpdateMedicationCommand,
} from '../domain/model/medication.commands.ts';
import { AssistanceApiError } from './assistance-api-error.ts';
import { activities } from './assistance.local-data.ts';
import { administrations, handovers, medications, shifts } from './care-coordination.local-data.ts';

export interface HandoverSummary {
  readonly attended: readonly string[];
  readonly pending: readonly string[];
}

export interface CareCoordinationApi {
  readonly isSample: boolean;
  listShifts(from: Date, to: Date): Promise<CareShift[]>;
  /** Rejects with `conflict` when the shift coincides with another responsibility and `allowConflict` is false. */
  saveShift(command: AssignShiftCommand, caregiverName: string, allowConflict: boolean): Promise<CareShift>;
  deleteShift(shiftId: string): Promise<void>;
  listHandovers(): Promise<Handover[]>;
  requestHandover(fromShiftId: string, toShiftId: string, summary: HandoverSummary): Promise<Handover>;
  /**
   * `summary` is the outgoing shift as it stands when the relief is confirmed.
   * A substitute's acceptance hands them the shift and its open activities and doses.
   */
  answerHandover(handoverId: string, accept: boolean, actor: Caregiver, summary: HandoverSummary): Promise<Handover>;
  /** Asks another caregiver to take the shift; nothing moves until they accept. */
  proposeSubstitute(handoverId: string, substitute: Caregiver, actor: Caregiver): Promise<Handover>;
  markEscalated(handoverId: string): Promise<Handover>;
  listMedications(): Promise<MedicationSchedule[]>;
  scheduleMedication(command: ScheduleMedicationCommand, caregiver: Caregiver, actor: Caregiver): Promise<MedicationSchedule>;
  updateMedication(command: UpdateMedicationCommand, actor: Caregiver): Promise<MedicationSchedule>;
  suspendMedication(command: SuspendMedicationCommand, actor: Caregiver): Promise<MedicationSchedule>;
  assignMedicationResponsible(scheduleId: string, caregiver: Caregiver, actor: Caregiver): Promise<MedicationSchedule>;
  listAdministrations(from: Date, to: Date): Promise<MedicationAdministration[]>;
  recordAdministration(command: RecordAdministrationCommand, actor: Caregiver): Promise<MedicationAdministration>;
  markAlerted(administrationId: string): Promise<MedicationAdministration>;
}

function require<T extends { readonly id: string }>(collection: { find(id: string): T | undefined }, id: string): T {
  const found = collection.find(id);
  if (!found) throw new AssistanceApiError('not_found');
  return found;
}

function allow(ok: boolean) {
  if (!ok) throw new AssistanceApiError('forbidden');
}

function administrationsBetween(from: Date, to: Date): MedicationAdministration[] {
  const schedules = medications.all().map((props) => new MedicationSchedule(props));
  const stored = new Map(administrations.all().map((item) => [item.id, item]));
  const days = Math.round((to.getTime() - from.getTime()) / 86_400_000);
  const derived = Array.from({ length: days + 1 }, (_, index) => dosesFor(schedules, addDays(from, index))).flat();
  // Recorded doses win over the derived ones, even if the plan changed afterwards.
  const merged = new Map(derived.map((item) => [item.id, stored.get(item.id) ?? item]));
  for (const item of stored.values()) {
    const date = new Date(item.scheduledAt);
    if (date >= from && date < addDays(to, 1)) merged.set(item.id, item);
  }
  return [...merged.values()].map((props) => new MedicationAdministration(props));
}

/**
 * What still ties a caregiver to the household: running or future shifts,
 * open activities, medication schedules and reliefs. Removal waits for these.
 */
export function pendingDutiesOf(caregiverId: string, now: Date = new Date()): string[] {
  const duties: string[] = [];
  const ownShifts = shifts.all().filter((shift) => shift.caregiverId === caregiverId && new Date(shift.endsAt) > now);
  if (ownShifts.length) duties.push(`${ownShifts.length} turno(s) actuales o futuros`);
  const openActivities = activities.all().filter((item) => item.caregiverId === caregiverId && item.status === 'scheduled');
  if (openActivities.length) duties.push(`${openActivities.length} actividad(es) sin confirmar`);
  const today = toIsoDate(now);
  const plans = medications
    .all()
    .map((props) => new MedicationSchedule(props))
    .filter((plan) => plan.caregiverId === caregiverId && ['active', 'upcoming'].includes(plan.statusOn(today)));
  if (plans.length) duties.push(`Responsable de ${plans.map((plan) => plan.medication).join(', ')}`);
  const reliefs = handovers
    .all()
    .map((props) => new Handover(props))
    .filter((item) => item.isOpen && (item.fromCaregiverId === caregiverId || item.toCaregiverId === caregiverId));
  if (reliefs.length) duties.push(`${reliefs.length} relevo(s) sin confirmar`);
  const overdue = administrationsBetween(addDays(now, -2), now).filter(
    (item) => item.responsibleId === caregiverId && item.stateAt(now) === 'overdue',
  );
  if (overdue.length) duties.push(`${overdue.length} alerta(s) de medicación sin atender`);
  return duties;
}

/** The shift, with its open activities and unrecorded doses, passes to `substitute`. */
function reassignShift(shiftId: string, substitute: Caregiver) {
  const toShift = require(shifts, shiftId);
  const start = new Date(toShift.startsAt);
  const end = new Date(toShift.endsAt);
  shifts.save({ ...toShift, caregiverId: substitute.id, caregiverName: substitute.fullName });
  for (const item of activities.all()) {
    const at = new Date(`${item.date}T${item.time}:00`);
    if (item.status === 'scheduled' && item.caregiverId === toShift.caregiverId && at >= start && at < end) {
      activities.save({ ...item, caregiverId: substitute.id, caregiverName: substitute.fullName });
    }
  }
  for (const dose of administrationsBetween(start, end)) {
    const at = new Date(dose.scheduledAt);
    if (!dose.isFinal && dose.responsibleId === toShift.caregiverId && at >= start && at < end) {
      administrations.save({ ...dose.toProps(), responsibleId: substitute.id, responsibleName: substitute.fullName });
    }
  }
}

/**
 * shortcut: the shifts, handover and medication contracts are pending, so this
 * port runs in the browser with example data. The permission checks here
 * mirror what the backend must enforce; add the HTTP adapter next to it.
 */
const localCareCoordinationApi: CareCoordinationApi = {
  isSample: true,

  listShifts: async (from, to) => {
    const found = shifts.all().filter((shift) => new Date(shift.endsAt) > from && new Date(shift.startsAt) < to);
    return (await respond(found)).map((props) => new CareShift(props));
  },

  saveShift: async (command, caregiverName, allowConflict) => {
    const all = shifts.all().map((props) => new CareShift(props));
    const conflicts = shiftConflicts(
      { id: command.shiftId, caregiverId: command.values.caregiverId, start: command.start, end: command.end },
      all,
    );
    if (conflicts.length > 0 && !allowConflict) throw new AssistanceApiError('conflict');
    const saved = shifts.save({
      id: command.shiftId ?? crypto.randomUUID(),
      caregiverId: command.values.caregiverId,
      caregiverName,
      startsAt: command.start.toISOString(),
      endsAt: command.end.toISOString(),
      notes: command.values.notes,
    });
    return new CareShift(await respond(saved));
  },

  deleteShift: async (shiftId) => {
    if (handovers.all().some((item) => new Handover(item).isOpen && (item.fromShiftId === shiftId || item.toShiftId === shiftId))) {
      throw new AssistanceApiError('has_pending');
    }
    shifts.replaceAll(shifts.all().filter((shift) => shift.id !== shiftId));
    return respond(undefined);
  },

  listHandovers: async () => (await respond(handovers.all())).map((props) => new Handover(props)),

  requestHandover: async (fromShiftId, toShiftId, summary) => {
    // The board and the background check may both open it; the first one wins.
    const existing = handovers.all().find((item) => item.fromShiftId === fromShiftId);
    if (existing) return new Handover(await respond(existing));
    const from = require(shifts, fromShiftId);
    const to = require(shifts, toShiftId);
    const saved = handovers.save({
      id: crypto.randomUUID(),
      fromShiftId,
      toShiftId,
      fromCaregiverId: from.caregiverId,
      fromCaregiverName: from.caregiverName,
      toCaregiverId: to.caregiverId,
      toCaregiverName: to.caregiverName,
      status: 'pending',
      requestedAt: new Date().toISOString(),
      respondedAt: null,
      escalatedAt: null,
      attended: summary.attended,
      pending: summary.pending,
    });
    return new Handover(await respond(saved));
  },

  answerHandover: async (handoverId, accept, actor, summary) => {
    const current = require(handovers, handoverId);
    // Only the incoming caregiver can take or refuse the relief.
    allow(actor.id === current.toCaregiverId);
    const handover = new Handover(current);
    if (handover.status !== 'pending') throw new AssistanceApiError('already_recorded');
    if (accept && handover.substitute) reassignShift(current.toShiftId, actor);
    const saved = handovers.save({
      ...current,
      ...(accept ? summary : {}),
      status: accept ? (handover.substitute ? 'reassigned' : 'accepted') : 'declined',
      respondedAt: new Date().toISOString(),
    });
    return new Handover(await respond(saved));
  },

  proposeSubstitute: async (handoverId, substitute, actor) => {
    const current = require(handovers, handoverId);
    allow(actor.isPrincipal || actor.id === current.fromCaregiverId);
    if (!new Handover(current).isOpen) throw new AssistanceApiError('already_recorded');
    const saved = handovers.save({
      ...current,
      status: 'pending',
      substitute: true,
      toCaregiverId: substitute.id,
      toCaregiverName: substitute.fullName,
      respondedAt: null,
    });
    return new Handover(await respond(saved));
  },

  markEscalated: async (handoverId) => {
    const saved = handovers.save({ ...require(handovers, handoverId), escalatedAt: new Date().toISOString() });
    return new Handover(await respond(saved));
  },

  listMedications: async () => (await respond(medications.all())).map((props) => new MedicationSchedule(props)),

  scheduleMedication: async (command, caregiver, actor) => {
    allow(actor.can('manage_medications'));
    // The responsible must be authorized to record the doses they will give.
    allow(caregiver.can('record_medications'));
    const { medication, dose, times, frequency, startDate, endDate, assistedPersonId, indicationRef } = command.values;
    const props: MedicationScheduleProps = {
      id: crypto.randomUUID(),
      medication,
      assistedPersonId,
      caregiverId: caregiver.id,
      caregiverName: caregiver.fullName,
      startDate,
      endDate: endDate || null,
      revisions: [
        {
          effectiveFrom: startDate,
          dose,
          times,
          frequency: frequency || 'daily',
          indicationRef,
          recordedAt: new Date().toISOString(),
          recordedByName: actor.fullName,
        },
      ],
      suspension: null,
    };
    return new MedicationSchedule(await respond(medications.save(props)));
  },

  updateMedication: async (command, actor) => {
    allow(actor.can('manage_medications'));
    const current = require(medications, command.scheduleId);
    const { dose, times, frequency, effectiveFrom, indicationRef } = command.values;
    // Every earlier version stays; the new one wins from its date on.
    const saved = medications.save({
      ...current,
      revisions: [
        ...current.revisions,
        { effectiveFrom, dose, times, frequency: frequency || 'daily', indicationRef, recordedAt: new Date().toISOString(), recordedByName: actor.fullName },
      ],
    });
    return new MedicationSchedule(await respond(saved));
  },

  suspendMedication: async (command, actor) => {
    allow(actor.can('manage_medications'));
    const current = require(medications, command.scheduleId);
    const saved = medications.save({
      ...current,
      suspension: { from: command.from, source: command.source, recordedAt: new Date().toISOString(), recordedByName: actor.fullName },
    });
    return new MedicationSchedule(await respond(saved));
  },

  assignMedicationResponsible: async (scheduleId, caregiver, actor) => {
    allow(actor.can('manage_medications'));
    allow(caregiver.can('record_medications'));
    // Doses already recorded keep who was responsible then; the coming ones follow the new caregiver.
    const saved = medications.save({ ...require(medications, scheduleId), caregiverId: caregiver.id, caregiverName: caregiver.fullName });
    return new MedicationSchedule(await respond(saved));
  },

  listAdministrations: async (from, to) => respond(administrationsBetween(from, to).map((item) => item.toProps())).then((list) =>
    list.map((props) => new MedicationAdministration(props)),
  ),

  recordAdministration: async (command, actor) => {
    allow(actor.can('record_medications'));
    const [, scheduledAt] = command.administrationId.split('@');
    const day = new Date(scheduledAt);
    const found = administrationsBetween(day, day).find((item) => item.id === command.administrationId);
    if (!found) throw new AssistanceApiError('not_found');
    if (found.isFinal) throw new AssistanceApiError('already_recorded', found);
    const saved = administrations.save({
      ...found.toProps(),
      result: command.result,
      reason: command.result === 'omitted' ? command.reason : null,
      recordedAt: new Date().toISOString(),
      recordedByName: actor.fullName,
    });
    return new MedicationAdministration(await respond(saved));
  },

  markAlerted: async (administrationId) => {
    const [, scheduledAt] = administrationId.split('@');
    const day = new Date(scheduledAt);
    const found = administrationsBetween(day, day).find((item) => item.id === administrationId);
    if (!found) throw new AssistanceApiError('not_found');
    const saved = administrations.save({ ...found.toProps(), alertedAt: new Date().toISOString() });
    return new MedicationAdministration(await respond(saved));
  },
};

export function getCareCoordinationApi(): CareCoordinationApi {
  return localCareCoordinationApi;
}

