import type { NavIconName } from '@/shared/presentation/components/navigator/icon-paths.ts';
import type { Translations } from '../../../i18n/index.ts';
import type { OccurrenceStatus } from '../home.view-model.ts';

export type StatusTone = 'neutral' | 'accent' | 'success' | 'danger';

const STATUS_KEYS: Record<
  OccurrenceStatus,
  keyof Translations['home']['status']
> = {
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'inProgress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  MISSED: 'missed',
};

const STATUS_TONES: Record<OccurrenceStatus, StatusTone> = {
  SCHEDULED: 'neutral',
  IN_PROGRESS: 'accent',
  COMPLETED: 'success',
  CANCELLED: 'neutral',
  MISSED: 'neutral',
};

const STATUS_ICONS: Partial<Record<OccurrenceStatus, NavIconName>> = {
  SCHEDULED: 'calendar',
  IN_PROGRESS: 'clock',
  COMPLETED: 'check',
};

export function statusLabelKey(
  status: OccurrenceStatus,
): keyof Translations['home']['status'] {
  return STATUS_KEYS[status];
}

export function statusTone(status: OccurrenceStatus): StatusTone {
  return STATUS_TONES[status];
}

export function statusIcon(status: OccurrenceStatus): NavIconName | undefined {
  return STATUS_ICONS[status];
}
