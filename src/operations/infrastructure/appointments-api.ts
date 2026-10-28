import { Appointment, type AppointmentProps } from '../domain/model/appointment.ts';
import { EvaluationSlot, type EvaluationSlotProps } from '../domain/model/evaluation-slot.ts';

/** Why the backend refused the booking, read from its 409 detail. */
export type AppointmentConflict = 'SLOT_TAKEN' | 'NOT_PREAUTHORIZED' | 'ALREADY_SCHEDULED';

export class AppointmentRequestError extends Error {
  readonly status: number;
  readonly conflict: AppointmentConflict | null;

  constructor(status: number, message: string, conflict: AppointmentConflict | null = null) {
    super(message);
    this.name = 'AppointmentRequestError';
    this.status = status;
    this.conflict = conflict;
  }
}

export interface ScheduleAppointmentRequest {
  readonly draftId: string;
  readonly date: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly technicianId: number;
  readonly contactName: string;
  readonly contactPhone: string;
  readonly directions: string | null;
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
const APPOINTMENTS_PATH = import.meta.env.VITE_OPERATIONS_APPOINTMENTS_PATH ?? '/api/v1/appointments';

const CONFLICT_MESSAGES: Readonly<Record<AppointmentConflict, string>> = {
  SLOT_TAKEN: 'Ese horario acaba de ocuparse. Elige otra franja.',
  NOT_PREAUTHORIZED: 'Tu tarjeta todavía no tiene la preautorización. Vuelve al paso de pago para completarla.',
  ALREADY_SCHEDULED: 'Esta contratación ya tiene una evaluación agendada.',
};

function conflictOf(detail: string | undefined): AppointmentConflict {
  if (detail?.includes('preauthorized')) return 'NOT_PREAUTHORIZED';
  if (detail?.includes('already has')) return 'ALREADY_SCHEDULED';
  return 'SLOT_TAKEN';
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } });
  } catch {
    throw new AppointmentRequestError(0, 'No pudimos conectar con Alivia. Revisa tu conexión e inténtalo de nuevo.');
  }
  if (!response.ok) {
    const problem = await response.json().catch(() => null) as { detail?: string } | null;
    if (response.status === 409) {
      const conflict = conflictOf(problem?.detail);
      throw new AppointmentRequestError(409, CONFLICT_MESSAGES[conflict], conflict);
    }
    throw new AppointmentRequestError(response.status, problem?.detail ?? 'No pudimos completar la solicitud.');
  }
  return await response.json() as T;
}

export const appointmentsApi = {
  async listAvailableSlots(): Promise<readonly EvaluationSlot[]> {
    const slots = await request<EvaluationSlotProps[]>(`${API_BASE_URL}${APPOINTMENTS_PATH}/available-slots`);
    return slots.map((slot) => new EvaluationSlot(slot));
  },

  async schedule(body: ScheduleAppointmentRequest): Promise<Appointment> {
    const appointment = await request<AppointmentProps>(`${API_BASE_URL}${APPOINTMENTS_PATH}`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return new Appointment(appointment);
  },
};
