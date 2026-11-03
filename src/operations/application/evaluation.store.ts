import type { Appointment, EvaluationContact } from '../domain/model/appointment.ts';
import type { EvaluationSlot } from '../domain/model/evaluation-slot.ts';
import { appointmentsApi } from '../infrastructure/appointments-api.ts';
import { readChosenSlot, saveBookedAppointment, saveChosenSlot } from '../infrastructure/evaluation.storage.ts';

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

/** Books the chosen window with its technician; the backend checks again that it is still free. */
export async function confirmEvaluation(draftId: string, slot: EvaluationSlot, contact: EvaluationContact): Promise<Appointment> {
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
