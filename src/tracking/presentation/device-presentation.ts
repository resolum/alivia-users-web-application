import { DoorClosed, Lightbulb, Mic, PanelsTopLeft, type LucideIcon } from 'lucide-react';
import type { StatusTone } from '@/shared/presentation/components/ui/index.ts';
import type { DeviceHealth, DeviceKind } from '../domain/model/device.entity.ts';

export const KIND_ICON: Record<DeviceKind, LucideIcon> = {
  microphone: Mic,
  light: Lightbulb,
  window_sensor: PanelsTopLeft,
  door_sensor: DoorClosed,
};

export const HEALTH: Record<DeviceHealth, { label: string; tone: StatusTone }> = {
  operational: { label: 'Operativo', tone: 'success' },
  attention: { label: 'Requiere atención', tone: 'warning' },
  offline: { label: 'Sin conexión', tone: 'neutral' },
};
