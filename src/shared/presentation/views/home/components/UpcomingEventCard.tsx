import { Link } from 'react-router';
import { Icon } from '@/shared/presentation/components/navigator/Icon.tsx';
import { getNavItem } from '@/shared/presentation/components/navigator/nav-selectors.ts';
import {
  Card,
  SectionLabel,
} from '@/shared/presentation/components/ui/index.ts';
import { useLocale } from '@/shared/presentation/i18n/index.ts';
import {
  formatTimeRange,
  relativeDayLabel,
  todayInBusinessZone,
} from '../home.dates.ts';
import type { HomeUpcomingEvent } from '../home.view-model.ts';
import { useTranslations } from '../../../i18n/index.ts';

interface UpcomingEventCardProps {
  readonly event: HomeUpcomingEvent;
}

/** Next service or care event, with the assigned technician. */
export function UpcomingEventCard({ event }: UpcomingEventCardProps) {
  const t = useTranslations();
  const { locale } = useLocale();
  const incidentsRoute = getNavItem('incidents').route;
  const dayLabel = relativeDayLabel(
    event.date,
    todayInBusinessZone(),
    { today: t.home.dates.today, tomorrow: t.home.dates.tomorrow },
    locale,
  );
  const timeLabel = formatTimeRange(
    event.timeRange,
    locale,
    true,
    t.home.dates.overnight,
  );

  return (
    <Card tone="lavender" className="flex h-full flex-col p-5">
      <SectionLabel>{t.home.event.label}</SectionLabel>
      <h2 className="mt-2 text-lg font-semibold text-alivia-primary">
        {event.title}
      </h2>
      <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-alivia-text-muted">
        <Icon name="clock" className="size-4 shrink-0" />
        <span>
          {dayLabel}
          <span aria-hidden="true"> · </span>
          {timeLabel}
        </span>
      </p>
      {event.technicianName && (
        <div className="mt-4 flex items-center gap-3 rounded-xl bg-white/70 p-3">
          <Icon
            name="user-wrench"
            className="size-5 shrink-0 text-alivia-secondary-deep"
          />
          <div>
            <p className="text-xs text-alivia-text-soft">
              {t.home.event.technician}
            </p>
            <p className="text-sm font-semibold text-alivia-text">
              {event.technicianName}
            </p>
          </div>
        </div>
      )}
      <Link
        to={event.route ?? incidentsRoute}
        className={[
          'mt-4 inline-flex min-h-11 w-full items-center justify-between gap-2',
          'rounded-xl bg-white px-4 py-2 text-sm font-semibold text-alivia-primary',
          'transition-colors hover:bg-alivia-mint',
        ].join(' ')}
      >
        {t.home.event.viewFollowUp}
        <Icon name="arrow-right" className="size-4" />
      </Link>
    </Card>
  );
}
