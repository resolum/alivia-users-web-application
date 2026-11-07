import type { Appointment, EvaluationContact } from '../domain/model/appointment.ts';
import type { EvaluationSlot } from '../domain/model/evaluation-slot.ts';
import { appointmentsApi } from '../infrastructure/appointments-api.ts';
import { clearEvaluationChoice, readChosenSlot, saveBookedAppointment, saveChosenSlot } from '../infrastructure/evaluation.storage.ts';

/** Forgets the window chosen for the visit and the booked visit (after signing out). */
export function forgetEvaluationChoice(): void {
  clearEvaluationChoice();
}

export function loadAvailableSlots(draftId: string | null = null): Promise<readonly EvaluationSlot[]> {
  return appointmentsApi.listAvailableSlots(draftId);
}

export function chooseSlot(slot: EvaluationSlot): void {
  saveChosenSlot(slot);
}

/**
 * Holds the window and technician for this request before paying, so no other family can take them.
 * Throws an {@link AppointmentRequestError} with the SLOT_TAKEN conflict when someone got there first.
 */
export async function holdSlot(draftId: string, slot: EvaluationSlot): Promise<void> {
  await appointmentsApi.hold(draftId, slot);
  saveChosenSlot(slot);
}

/** Renews the hold of the chosen window right before paying; false when there is no chosen window. */
export async function renewChosenSlot(draftId: string): Promise<boolean> {
  const slot = readChosenSlot();
  if (slot === null) return false;
  await appointmentsApi.hold(draftId, slot);
  return true;
}

/** The window picked in the "Instalación" substep: held while paying, booked when the payment is authorized. */
export function currentChosenSlot(): EvaluationSlot | null {
  return readChosenSlot();
}

/** Bookings in flight by draft, so a repeated call (React StrictMode, a double click) reuses the same request. */
const bookingsInFlight = new Map<string, Promise<Appointment>>();

/**
 * Books the chosen window with its technician; the backend checks again that it is still free. Concurrent calls
 * for the same draft share one request, and the backend answers a repeated booking with the visit already made.
 */
export function confirmEvaluation(draftId: string, slot: EvaluationSlot, contact: EvaluationContact): Promise<Appointment> {
  const inFlight = bookingsInFlight.get(draftId);
  if (inFlight) return inFlight;
  const booking = scheduleEvaluation(draftId, slot, contact).finally(() => bookingsInFlight.delete(draftId));
  bookingsInFlight.set(draftId, booking);
  return booking;
}

async function scheduleEvaluation(draftId: string, slot: EvaluationSlot, contact: EvaluationContact): Promise<Appointment> {
  const appointment = await appointmentsApi.schedule({
    draftId,
    date: slot.date,
    startTime: slot.startTime,
    endTime: slot.endTime,
    technicianId: slot.technicianId,
    contactName: null,
    contactPhone: null,
    directions: contact.directions.trim() === '' ? null : contact.directions.trim(),
  });
  saveBookedAppointment(appointment);
  saveChosenSlot(null);
  return appointment;
}
