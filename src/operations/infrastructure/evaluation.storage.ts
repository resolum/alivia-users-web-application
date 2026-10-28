import { Appointment, type AppointmentProps } from '../domain/model/appointment.ts';
import { EvaluationSlot, type EvaluationSlotProps } from '../domain/model/evaluation-slot.ts';

const SLOT_KEY = 'alivia.evaluation-slot';
const APPOINTMENT_KEY = 'alivia.evaluation-appointment';

function read<T>(key: string, build: (value: never) => T): T | null {
  const raw = window.sessionStorage.getItem(key);
  if (raw === null) return null;
  try {
    return build(JSON.parse(raw) as never);
  } catch {
    window.sessionStorage.removeItem(key);
    return null;
  }
}

export function saveChosenSlot(slot: EvaluationSlot | null): void {
  if (slot === null) window.sessionStorage.removeItem(SLOT_KEY);
  else window.sessionStorage.setItem(SLOT_KEY, JSON.stringify(slot.toProps()));
}

export function readChosenSlot(): EvaluationSlot | null {
  return read(SLOT_KEY, (props: EvaluationSlotProps) => new EvaluationSlot(props));
}

export function saveBookedAppointment(appointment: Appointment): void {
  window.sessionStorage.setItem(APPOINTMENT_KEY, JSON.stringify(appointment));
}

/** The appointment booked for this draft, so a reload shows it instead of asking again. */
export function readBookedAppointment(draftId: string): Appointment | null {
  const appointment = read(APPOINTMENT_KEY, (props: AppointmentProps) => new Appointment(props));
  return appointment?.draftId === draftId ? appointment : null;
}
