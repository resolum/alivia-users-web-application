import { Link } from 'react-router';
import { Icon } from '@/shared/presentation/components/navigator/Icon.tsx';
import { getNavItem } from '@/shared/presentation/components/navigator/nav-selectors.ts';
import {
  ArrowLink,
  Card,
  Chip,
  SectionLabel,
} from '@/shared/presentation/components/ui/index.ts';
import { useLocale } from '@/shared/presentation/i18n/index.ts';
import {
  formatLocalTime,
  relativeDayLabel,
  todayInBusinessZone,
} from '../home.dates.ts';
import type { HomeAgendaItem } from '../home.view-model.ts';
import { useTranslations } from '../../../i18n/index.ts';
import { statusIcon, statusLabelKey, statusTone } from './activity-status.ts';

interface NextActivityCardProps {
  readonly activity: HomeAgendaItem | null;
  readonly assistedPersonName: string;
}

/** Guest card that highlights the next assigned activity. */
export function NextActivityCard({
  activity,
  assistedPersonName,
}: NextActivityCardProps) {
  const t = useTranslations();
  const { locale } = useLocale();
  const activitiesRoute = getNavItem('activities').route;

  if (!activity) {
    return (
      <Card className="p-5">
        <div className="py-8 text-center">
          <h2 className="font-bold text-alivia-primary">
            {t.home.guest.emptyTitle}
          </h2>
          <p className="mt-1 text-sm text-alivia-text-soft">
            {t.home.guest.emptyDescription}
          </p>
          <div className="mt-3 flex justify-center">
            <ArrowLink to={activitiesRoute} tone="muted">
              {t.home.guest.viewMyActivities}
            </ArrowLink>
          </div>
        </div>
      </Card>
    );
  }

  const dayLabel = relativeDayLabel(
    activity.date,
    todayInBusinessZone(),
    { today: t.home.dates.today, tomorrow: t.home.dates.tomorrow },
    locale,
  );

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="size-2 rounded-full bg-alivia-secondary-deep"
          />
          <SectionLabel>{t.home.guest.nextActivityLabel}</SectionLabel>
        </div>
        <Chip
          tone={statusTone(activity.status)}
          icon={statusIcon(activity.status)}
        >
          {t.home.status[statusLabelKey(activity.status)]}
        </Chip>
      </div>

      <hr className="my-4 h-px border-0 bg-alivia-primary-mist" />

      <p className="flex items-center gap-2 text-sm font-bold text-alivia-primary">
        <Icon name="clock" className="size-4 shrink-0" />
        <span>
          {dayLabel}
          <span aria-hidden="true"> · </span>
          {formatLocalTime(activity.timeRange.start, locale, true)}
        </span>
      </p>
      <h2 className="mt-1 text-xl font-bold text-alivia-primary">
        {activity.title}
      </h2>
      {assistedPersonName && (
        <p className="mt-1 text-sm font-semibold text-alivia-secondary-deep">
          {assistedPersonName}
        </p>
      )}
      {activity.description && (
        <p className="mt-2 text-sm text-alivia-text-soft">
          {activity.description}
        </p>
      )}

      <hr className="my-4 h-px border-0 bg-alivia-primary-mist" />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Link
          to={activitiesRoute}
          className={[
            'inline-flex min-h-11 flex-1 items-center justify-center gap-2',
            'rounded-xl bg-alivia-secondary-deep px-4 py-2 text-sm font-semibold',
            'text-white transition-[background-color,scale] duration-150 ease-out',
            'hover:bg-alivia-secondary-dark active:scale-[0.97]',
          ].join(' ')}
        >
          {t.home.guest.viewActivity}
          <Icon name="arrow-right" className="size-4" />
        </Link>
        <ArrowLink
          to={activitiesRoute}
          tone="muted"
          className="justify-center sm:justify-start"
        >
          {t.home.guest.viewMyActivities}
        </ArrowLink>
      </div>
    </Card>
  );
}
