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
  readonly contactName: string | null;
  readonly contactPhone: string | null;
  readonly directions: string | null;
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
const APPOINTMENTS_PATH = `/${import.meta.env.VITE_APPOINTMENTS_ENDPOINT_PATH}`;

export interface SlotHold {
  readonly draftId: string;
  readonly date: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly technicianId: number;
  readonly technicianName: string;
  readonly expiresAt: string;
}

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
  const response = await send(url, init);
  return await response.json() as T;
}

async function send(url: string, init?: RequestInit): Promise<Response> {
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
  return response;
}

export const appointmentsApi = {
  /** Every free technician of each window; the window {@code draftId} holds is still listed for it. */
  async listAvailableSlots(draftId: string | null = null): Promise<readonly EvaluationSlot[]> {
    const query = draftId === null ? '' : `?draftId=${encodeURIComponent(draftId)}`;
    const slots = await request<EvaluationSlotProps[]>(`${API_BASE_URL}${APPOINTMENTS_PATH}/available-slots${query}`);
    return slots.map((slot) => new EvaluationSlot(slot));
  },

  /** Holds the window and technician for 30 minutes, or renews the hold; 409 when someone else took it. */
  async hold(draftId: string, slot: EvaluationSlot): Promise<SlotHold> {
    return await request<SlotHold>(`${API_BASE_URL}${APPOINTMENTS_PATH}/holds/${encodeURIComponent(draftId)}`, {
      method: 'PUT',
      body: JSON.stringify({ date: slot.date, startTime: slot.startTime, endTime: slot.endTime, technicianId: slot.technicianId }),
    });
  },

  async release(draftId: string): Promise<void> {
    await send(`${API_BASE_URL}${APPOINTMENTS_PATH}/holds/${encodeURIComponent(draftId)}`, { method: 'DELETE' });
  },

  async schedule(body: ScheduleAppointmentRequest): Promise<Appointment> {
    const appointment = await request<AppointmentProps>(`${API_BASE_URL}${APPOINTMENTS_PATH}`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return new Appointment(appointment);
  },
};
