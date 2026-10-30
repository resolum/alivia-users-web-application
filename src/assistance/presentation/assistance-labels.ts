import {
  Bath,
  Footprints,
  GlassWater,
  Music,
  Pill,
  Users,
  Utensils,
  type LucideIcon,
} from 'lucide-react';
import type { StatusTone } from '@/shared/presentation/components/ui/index.ts';
import type { ActivityState, ActivityType, Repetition } from '../domain/model/care-activity.entity.ts';
import type { CaregiverLinkStatus, Relationship, Responsibility } from '../domain/model/caregiver.entity.ts';

export const RESPONSIBILITY_LABELS: Record<Responsibility, string> = {
  view_activities: 'Consultar actividades',
  manage_activities: 'Gestionar actividades',
  receive_notifications: 'Recibir notificaciones',
  view_devices: 'Consultar dispositivos',
  receive_device_alerts: 'Recibir alertas de dispositivos',
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
  overdue: { label: 'Vencida', tone: 'danger' },
  cancelled: { label: 'Cancelada', tone: 'neutral' },
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
