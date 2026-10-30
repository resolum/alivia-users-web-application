import { Link } from 'react-router';
import { Icon } from '@/shared/presentation/components/navigator/Icon.tsx';
import { getNavItem } from '@/shared/presentation/components/navigator/nav-selectors.ts';
import { SectionLabel } from '@/shared/presentation/components/ui/index.ts';
import type { HomeGreeting } from '../home.view-model.ts';
import { useTranslations } from '../../../i18n/index.ts';

interface HomeHeaderProps {
  readonly greeting: HomeGreeting;
  readonly dateLabel: string;
}

const secondaryActionClasses = [
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl',
  'border border-alivia-primary-mist bg-white px-4 py-2 text-sm font-semibold',
  'text-alivia-text-muted transition-[background-color,scale] duration-150 hover:bg-alivia-primary-mist active:scale-[0.97]',
].join(' ');

const primaryActionClasses = [
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl',
  'bg-alivia-primary px-4 py-2 text-sm font-semibold text-white',
  'transition-[background-color,scale] duration-150 hover:bg-alivia-primary-mid active:scale-[0.97]',
].join(' ');

/** Greeting, page date and the two primary actions of the principal Home. */
export function HomeHeader({ greeting, dateLabel }: HomeHeaderProps) {
  const t = useTranslations();
  const name = greeting.name.firstName.trim();
  const title = name
    ? t.home.greeting.hello.replace('{name}', name)
    : t.home.greeting.helloNoName;
  const incidentsRoute = getNavItem('incidents').route;
  const activitiesRoute = getNavItem('activities').route;

  return (
    <header className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <SectionLabel>{t.home.principal.summaryLabel}</SectionLabel>
          <h1 className="text-3xl font-bold text-alivia-primary sm:text-4xl">
            {title}
          </h1>
          <p className="text-sm text-alivia-text-soft">{dateLabel}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to={`${incidentsRoute}?report=1`} className={secondaryActionClasses}>
            <Icon name="alert-triangle" className="size-4" />
            {t.home.principal.reportIncident}
          </Link>
          <Link to={`${activitiesRoute}?new=1`} className={primaryActionClasses}>
            <Icon name="plus" className="size-4" />
            {t.home.principal.newActivity}
          </Link>
        </div>
      </div>
    </header>
  );
}
