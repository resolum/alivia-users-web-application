import { Icon } from '@/shared/presentation/components/navigator/Icon.tsx';
import type { NavIconName } from '@/shared/presentation/components/navigator/icon-paths.ts';
import { Chip } from '@/shared/presentation/components/ui/index.ts';
import { useLocale } from '@/shared/presentation/i18n/index.ts';
import { formatLocalTime } from '../home.dates.ts';
import type { CareActivityType, HomeAgendaItem } from '../home.view-model.ts';
import { useTranslations } from '../../../i18n/index.ts';
import { statusIcon, statusLabelKey, statusTone } from './activity-status.ts';

interface ActivityTimelineItemProps {
  readonly item: HomeAgendaItem;
  readonly isLast: boolean;
}

const TYPE_ICONS: Record<CareActivityType, NavIconName> = {
  MEDICATION: 'pill',
  BATH: 'droplet',
  MEAL: 'utensils',
  EXERCISE: 'pulse',
  THERAPY: 'heart',
  APPOINTMENT: 'calendar',
  OTHER: 'clock',
};

/** One scheduled activity in the assisted-person timeline. */
export function ActivityTimelineItem({
  item,
  isLast,
}: ActivityTimelineItemProps) {
  const t = useTranslations();
  const { locale } = useLocale();
  const isCompleted = item.status === 'COMPLETED';
  const nodeClass = isCompleted
    ? 'bg-alivia-secondary-deep text-white'
    : 'bg-alivia-primary-mist text-alivia-secondary-deep';

  return (
    <li className="flex gap-3 pb-6 last:pb-0">
      <div className="flex flex-col items-center">
        <span
          className={`flex size-9 shrink-0 items-center justify-center rounded-full ${nodeClass}`}
        >
          <Icon name={isCompleted ? 'check' : TYPE_ICONS[item.type]} className="size-4" />
        </span>
        {!isLast && (
          <span
            aria-hidden="true"
            className="mt-1 w-px flex-1 bg-alivia-primary-mist"
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="text-sm text-alivia-text">
            <span className="font-semibold text-alivia-primary">
              {formatLocalTime(item.timeRange.start, locale, false)}
            </span>
            <span aria-hidden="true"> · </span>
            <span className="font-bold">{item.title}</span>
          </p>
          <Chip
            tone={statusTone(item.status)}
            icon={statusIcon(item.status)}
          >
            {t.home.status[statusLabelKey(item.status)]}
          </Chip>
        </div>
        <p className="mt-1 text-xs text-alivia-text-soft">
          {t.home.timeline.responsible.replace('{name}', item.responsibleName)}
        </p>
      </div>
    </li>
  );
}
