import { Cpu, DoorClosed, Lightbulb, Mic, PanelsTopLeft, type LucideIcon } from 'lucide-react';
import type { StatusTone } from '@/shared/presentation/components/ui/index.ts';
import type { IncidentDeviceKind, IncidentStage, ProblemType } from '../domain/model/incident.entity.ts';

export const DEVICE_ICON: Record<IncidentDeviceKind, LucideIcon> = {
  microphone: Mic,
  light: Lightbulb,
  window_sensor: PanelsTopLeft,
  door_sensor: DoorClosed,
  other: Cpu,
};

export const STAGE: Record<IncidentStage, { label: string; short: string; tone: StatusTone }> = {
  registered: { label: 'Registrada', short: 'Registrada', tone: 'info' },
  evaluating: { label: 'En evaluación', short: 'En evaluación', tone: 'neutral' },
  visit_scheduled: { label: 'Visita programada', short: 'Visita programada', tone: 'success' },
  in_attention: { label: 'En atención', short: 'En atención', tone: 'info' },
  resolved: { label: 'Resuelta', short: 'Resuelta', tone: 'success' },
};

export const PROBLEM_LABELS: Record<ProblemType, string> = {
  battery: 'Batería o alimentación',
  no_response: 'No responde a comandos',
  false_alarm: 'Avisos falsos',
  connectivity: 'Conexión intermitente',
  physical_damage: 'Daño físico',
  other: 'Otro problema',
};

/** "16 oct. · 10:30 a. m. – 12:00 p. m." */
export function formatWindow(start: string, end: string): string {
  const day = new Date(start).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
  const time = (iso: string) => new Date(iso).toLocaleTimeString('es-PE', { hour: 'numeric', minute: '2-digit' });
  return `${day} · ${time(start)} – ${time(end)}`;
}

export const SUPPORT_PHONE = '(01) 640-2020';
