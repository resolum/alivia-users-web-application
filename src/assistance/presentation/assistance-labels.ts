import {
  Bath,
  CircleCheck,
  CircleX,
  Clock,
  Footprints,
  GlassWater,
  Music,
  Pill,
  TriangleAlert,
  Users,
  Utensils,
  type LucideIcon,
} from 'lucide-react';
import type { StatusTone } from '@/shared/presentation/components/ui/index.ts';
import type { ActivityState, ActivityType, Repetition } from '../domain/model/care-activity.entity.ts';
import type { CaregiverLinkStatus, Relationship, Responsibility } from '../domain/model/caregiver.entity.ts';
import type { HandoverStatus } from '../domain/model/handover.entity.ts';
import type { AdministrationState } from '../domain/model/medication-administration.entity.ts';
import type { Frequency } from '../domain/model/medication-schedule.entity.ts';
import type { MedicationFieldError } from '../domain/model/medication.commands.ts';

export const RESPONSIBILITY_LABELS: Record<Responsibility, string> = {
  view_activities: 'Consultar actividades',
  manage_activities: 'Gestionar actividades',
  receive_notifications: 'Recibir notificaciones',
  view_devices: 'Consultar dispositivos',
  receive_device_alerts: 'Recibir alertas de dispositivos',
  manage_medications: 'Programar medicamentos',
  record_medications: 'Registrar administración de medicamentos',
};

export const RELATIONSHIP_LABELS: Record<Relationship, string> = {
  family: 'Familiar',
  external_caregiver: 'Cuidador externo',
  health_professional: 'Profesional de salud',
  other: 'Otro',
};

export const LINK_STATUS: Record<CaregiverLinkStatus, { label: string; tone: StatusTone }> = {
  active: { label: 'Activo', tone: 'success' },
  pending: { label: 'Invitación pendiente', tone: 'info' },
  expired: { label: 'Invitación vencida', tone: 'danger' },
};

export const ACTIVITY_TYPE: Record<ActivityType, { label: string; icon: LucideIcon }> = {
  hygiene: { label: 'Higiene y aseo', icon: Bath },
  medication: { label: 'Medicación', icon: Pill },
  nutrition: { label: 'Alimentación', icon: Utensils },
  hydration: { label: 'Hidratación', icon: GlassWater },
  mobility: { label: 'Movilidad y ejercicios', icon: Footprints },
  leisure: { label: 'Descanso y ocio', icon: Music },
  social: { label: 'Visitas y reuniones', icon: Users },
};

export const ACTIVITY_STATE: Record<ActivityState, { label: string; tone: StatusTone }> = {
  completed: { label: 'Completada', tone: 'success' },
  pending: { label: 'Pendiente', tone: 'info' },
  scheduled: { label: 'Programada', tone: 'info' },
  overdue: { label: 'Pendiente, vencida', tone: 'danger' },
  cancelled: { label: 'Cancelada', tone: 'neutral' },
};

/** The guest's agenda names states shortly; the icon repeats the meaning for color-blind readers. */
export const GUEST_STATE: Record<ActivityState, { label: string; icon: LucideIcon; tone: string }> = {
  completed: { label: 'Completada', icon: CircleCheck, tone: 'border-alivia-secondary/40 bg-alivia-mint text-alivia-secondary-deep' },
  pending: { label: 'Pendiente', icon: Clock, tone: 'border-alivia-primary-light/50 bg-alivia-primary-mist text-alivia-primary' },
  overdue: { label: 'Vencida', icon: TriangleAlert, tone: 'border-alivia-warning/40 bg-alivia-warning-soft text-alivia-warning' },
  scheduled: { label: 'Programada', icon: Clock, tone: 'border-alivia-primary-mist bg-alivia-page text-alivia-text-muted' },
  cancelled: { label: 'Cancelada', icon: CircleX, tone: 'border-alivia-primary-mist bg-white text-alivia-text-muted' },
};

export const REPETITION_LABELS: Record<Repetition, string> = {
  none: 'No se repite',
  daily: 'Diariamente',
  weekdays: 'De lunes a viernes',
  weekly: 'Cada semana',
};

export const DURATION_OPTIONS = [15, 20, 30, 45, 60, 90] as const;
export const REMINDER_OPTIONS = [5, 15, 30, 60] as const;

/** "08:00 AM" from "08:00". */
export function formatClock(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const suffix = hours < 12 ? 'AM' : 'PM';
  const twelve = hours % 12 === 0 ? 12 : hours % 12;
  return `${String(twelve).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

export function formatSince(isoDate: string): string {
  return new Date(`${isoDate.slice(0, 10)}T12:00:00`).toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export const MEDICATION_ERROR_TEXT: Record<MedicationFieldError, string> = {
  required: 'Este dato es obligatorio.',
  invalid_time: 'Usa horas válidas, por ejemplo 08:00.',
  duplicate_time: 'Hay horarios repetidos.',
  end_before_start: 'La vigencia debe terminar después de empezar.',
  in_past: 'Elige hoy o una fecha posterior.',
};

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  daily: 'Todos los días',
  every_other_day: 'Interdiario',
  weekly: 'Una vez por semana',
};

export const ADMINISTRATION_STATE: Record<AdministrationState, { label: string; tone: StatusTone }> = {
  pending: { label: 'Pendiente', tone: 'info' },
  overdue: { label: 'Vencida sin confirmar', tone: 'danger' },
  given: { label: 'Administrado', tone: 'success' },
  omitted: { label: 'Omitido', tone: 'warning' },
};

export const HANDOVER_STATUS: Record<HandoverStatus, { label: string; tone: StatusTone }> = {
  pending: { label: 'Esperando aceptación', tone: 'info' },
  declined: { label: 'Rechazado, falta sustituto', tone: 'danger' },
  accepted: { label: 'Aceptado', tone: 'success' },
  reassigned: { label: 'Asumido por sustituto', tone: 'success' },
};

/** "8:00 a. m. – 4:00 p. m.", with the end day when the shift crosses midnight. */
export function formatRange(start: Date, end: Date): string {
  const time = (date: Date) => date.toLocaleTimeString('es-PE', { hour: 'numeric', minute: '2-digit' });
  const sameDay = start.toDateString() === end.toDateString();
  return `${time(start)} – ${sameDay ? '' : `${end.toLocaleDateString('es-PE', { weekday: 'short' })} `}${time(end)}`;
}
