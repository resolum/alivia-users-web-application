import { loadNotifications, publishNotification } from '@/communication/index.ts';
import { addDays, formatTime, toIsoDate } from '@/shared/domain/model/valueobjects/relative-time.ts';
import type { AccessLevel } from '@/shared/presentation/session/session.types.ts';
import type { AssignShiftCommand } from '../domain/model/assign-shift.command.ts';
import type { CareShift } from '../domain/model/care-shift.entity.ts';
import type { Caregiver, CareNetwork } from '../domain/model/caregiver.entity.ts';
import { HANDOVER_LEAD_MINUTES, reliefFor, type Handover } from '../domain/model/handover.entity.ts';
import type { MedicationAdministration, RecordAdministrationCommand } from '../domain/model/medication-administration.entity.ts';
import type {
  ScheduleMedicationCommand,
  SuspendMedicationCommand,
  UpdateMedicationCommand,
} from '../domain/model/medication.commands.ts';
import { getAssistanceApi } from '../infrastructure/assistance-api.ts';
import { AssistanceApiError } from '../infrastructure/assistance-api-error.ts';
import { getCareCoordinationApi, type HandoverSummary } from '../infrastructure/care-coordination-api.ts';
import { startOfWeek } from './assistance.store.ts';

const api = () => getCareCoordinationApi();

export const isCoordinationSample = () => api().isSample;

const reject = () => Promise.reject(new Error('validation_failed'));

/**
 * The caregiver behind the session.
 * shortcut: guests are matched by display name until IAM returns the caregiver id; upgrade when the session carries it.
 */
export function resolveActor(network: CareNetwork, accessLevel: AccessLevel, displayName: string | undefined): Caregiver {
  if (accessLevel === 'principal') return network.principal;
  const linked = network.additional.filter((caregiver) => caregiver.status === 'active');
  return linked.find((caregiver) => caregiver.fullName === displayName) ?? linked[0] ?? network.principal;
}

export const linkedCaregivers = (network: CareNetwork) => [
  network.principal,
  ...network.additional.filter((caregiver) => caregiver.status === 'active'),
];

// --- Shifts and relief ---

export interface ShiftBoard {
  readonly shifts: CareShift[];
  readonly handovers: Handover[];
}

/**
 * Shifts of the 7 days from `weekStart`, plus the reliefs around them. A shift
 * about to end gets its relief opened even if nobody asked, and any relief left
 * unconfirmed past its period is escalated to the principal here.
 * shortcut: runs when someone opens the board; the backend job should do both on its own.
 */
export async function loadShiftBoard(weekStart: Date, now: Date = new Date()): Promise<ShiftBoard> {
  const [shifts, existing] = await Promise.all([
    api().listShifts(addDays(weekStart, -1), addDays(weekStart, 8)),
    api().listHandovers(),
  ]);
  const due = shifts.flatMap((shift) => {
    const next = reliefFor(shifts, shift);
    const closing = now.getTime() >= shift.end.getTime() - HANDOVER_LEAD_MINUTES * 60_000;
    return next && closing && next.end > now && !existing.some((item) => item.fromShiftId === shift.id) ? [{ shift, next }] : [];
  });
  const opened = await Promise.all(due.map(({ shift, next }) => requestHandover(shift, next)));
  const handovers = [...existing, ...opened];
  const escalated = await Promise.all(
    handovers.map(async (handover) => {
      const from = shifts.find((shift) => shift.id === handover.fromShiftId);
      if (!from || !handover.needsEscalation(from.end, now)) return handover;
      await publishNotification({
        id: `escalation-${handover.id}`,
        kind: 'handover_escalated',
        title: 'Relevo sin confirmar',
        body: `${handover.toCaregiverName} no confirmó el relevo de ${from.caregiverName}. Hay riesgo de falta de cobertura.`,
        route: '/shifts',
        actionLabel: 'Resolver relevo',
      });
      return api().markEscalated(handover.id);
    }),
  );
  return { shifts, handovers: escalated };
}

/**
 * Opens due reliefs, escalates unconfirmed ones and raises overdue-dose alerts.
 * shortcut: runs every minute while someone has the app open; the backend job must do it when nobody does.
 */
export async function runCareChecks(now: Date = new Date()): Promise<void> {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  await Promise.all([loadShiftBoard(startOfWeek(now), now), loadAdministrations(addDays(today, -1), today, now)]);
}

export function saveShift(command: AssignShiftCommand, network: CareNetwork, allowConflict: boolean): Promise<CareShift> {
  if (Object.keys(command.validate()).length > 0) return reject();
  const caregiver = linkedCaregivers(network).find((item) => item.id === command.values.caregiverId);
  if (!caregiver) return reject();
  return api().saveShift(command, caregiver.fullName, allowConflict);
}

export const deleteShift = (shiftId: string) => api().deleteShift(shiftId);

const within = (iso: string, shift: CareShift) => new Date(iso) >= shift.start && new Date(iso) < shift.end;

/** What was done and what is left of a shift, for whoever takes it over. */
async function summarize(from: CareShift): Promise<HandoverSummary> {
  const [activities, doses, alerts] = await Promise.all([
    getAssistanceApi().listActivities(toIsoDate(from.start), toIsoDate(from.end)),
    api().listAdministrations(from.start, from.end),
    loadNotifications(),
  ]);
  const attended: string[] = [];
  const pending: string[] = [];
  for (const activity of activities.filter((item) => item.startsAt >= from.start && item.startsAt < from.end)) {
    const line = `${activity.title} · ${activity.time}`;
    if (activity.status === 'completed') attended.push(`${line} · completada`);
    else if (activity.status === 'scheduled') pending.push(line);
  }
  for (const dose of doses.filter((item) => within(item.scheduledAt, from))) {
    const line = `${dose.medication} ${dose.dose} · ${formatTime(dose.scheduledAt)}`;
    if (dose.result === 'given') attended.push(`${line} · administrado`);
    else if (dose.result === 'omitted') attended.push(`${line} · omitido`);
    else pending.push(line);
  }
  // Overdue doses are already listed above; the rest of the alerts raised during the shift go here.
  for (const alert of alerts.filter((item) => item.kind !== 'medication_overdue' && within(item.createdAt, from))) {
    const line = `Alerta: ${alert.title} · ${formatTime(alert.createdAt)}`;
    if (alert.read) attended.push(`${line} · revisada`);
    else pending.push(line);
  }
  return { attended, pending };
}

/** Asks the next caregiver to take over, with what was done and what is left of the outgoing shift. */
export async function requestHandover(from: CareShift, to: CareShift): Promise<Handover> {
  return api().requestHandover(from.id, to.id, await summarize(from));
}

/** On acceptance the summary is taken again, so the new responsible gets it as it stands at the transfer. */
export async function answerHandover(handoverId: string, accept: boolean, actor: Caregiver, from: CareShift): Promise<Handover> {
  return api().answerHandover(handoverId, accept, actor, accept ? await summarize(from) : { attended: [], pending: [] });
}

/** The substitute becomes responsible only once they accept, through answerHandover. */
export const proposeSubstitute = (handoverId: string, substitute: Caregiver, actor: Caregiver) =>
  api().proposeSubstitute(handoverId, substitute, actor);

// --- Medications ---

export const loadMedications = () => api().listMedications();

export function scheduleMedication(command: ScheduleMedicationCommand, network: CareNetwork, actor: Caregiver) {
  if (Object.keys(command.validate()).length > 0) return reject();
  const caregiver = linkedCaregivers(network).find((item) => item.id === command.values.caregiverId);
  if (!caregiver) return reject();
  return api().scheduleMedication(command, caregiver, actor);
}

export function updateMedication(command: UpdateMedicationCommand, actor: Caregiver) {
  if (Object.keys(command.validate(toIsoDate(new Date()))).length > 0) return reject();
  return api().updateMedication(command, actor);
}

export function suspendMedication(command: SuspendMedicationCommand, actor: Caregiver) {
  if (Object.keys(command.validate(toIsoDate(new Date()))).length > 0) return reject();
  return api().suspendMedication(command, actor);
}

export function assignMedicationResponsible(scheduleId: string, caregiverId: string, network: CareNetwork, actor: Caregiver) {
  const caregiver = linkedCaregivers(network).find((item) => item.id === caregiverId);
  if (!caregiver) return reject();
  return api().assignMedicationResponsible(scheduleId, caregiver, actor);
}

/** Doses between two days; each one whose window lapsed raises its alert once. */
export async function loadAdministrations(from: Date, to: Date, now: Date = new Date()): Promise<MedicationAdministration[]> {
  const list = await api().listAdministrations(from, to);
  return Promise.all(
    list.map(async (item) => {
      if (item.stateAt(now) !== 'overdue' || item.alertedAt) return item;
      await publishNotification({
        id: `dose-${item.id}`,
        kind: 'medication_overdue',
        title: 'Medicamento sin confirmar',
        body: `${item.medication} de las ${formatTime(item.scheduledAt)} no tiene registro. Responsable: ${item.responsibleName}.`,
        route: '/medications',
        actionLabel: 'Registrar resultado',
      });
      return api().markAlerted(item.id);
    }),
  );
}

export type RecordOutcome =
  | { readonly status: 'recorded'; readonly administration: MedicationAdministration }
  | { readonly status: 'duplicate'; readonly administration: MedicationAdministration };

/** A dose that already has a result is not recorded again; the existing result comes back instead. */
export async function recordAdministration(command: RecordAdministrationCommand, actor: Caregiver): Promise<RecordOutcome> {
  if (command.validate()) return reject();
  try {
    return { status: 'recorded', administration: await api().recordAdministration(command, actor) };
  } catch (error) {
    if (error instanceof AssistanceApiError && error.code === 'already_recorded') {
      return { status: 'duplicate', administration: error.existing as MedicationAdministration };
    }
    throw error;
  }
}
