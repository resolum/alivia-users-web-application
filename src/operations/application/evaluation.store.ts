import { toInternationalPhone, type Appointment, type EvaluationContact } from '../domain/model/appointment.ts';
import type { EvaluationSlot } from '../domain/model/evaluation-slot.ts';
import { appointmentsApi } from '../infrastructure/appointments-api.ts';
import { readChosenSlot, saveBookedAppointment, saveChosenSlot } from '../infrastructure/evaluation.storage.ts';

export function loadAvailableSlots(): Promise<readonly EvaluationSlot[]> {
  return appointmentsApi.listAvailableSlots();
}

export function chooseSlot(slot: EvaluationSlot): void {
  saveChosenSlot(slot);
}

/** The window picked in the "Instalación" substep, not booked until the evaluation is confirmed. */
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
    contactName: contact.name.trim(),
    contactPhone: toInternationalPhone(contact.phone),
    directions: contact.directions.trim() === '' ? null : contact.directions.trim(),
  });
  saveBookedAppointment(appointment);
  saveChosenSlot(null);
  return appointment;
}
