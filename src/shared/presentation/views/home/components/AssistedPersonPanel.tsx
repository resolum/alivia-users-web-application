import { Icon } from '@/shared/presentation/components/navigator/Icon.tsx';
import { getNavItem } from '@/shared/presentation/components/navigator/nav-selectors.ts';
import {
  ArrowLink,
  Card,
  Chip,
  EmptyState,
  SectionLabel,
} from '@/shared/presentation/components/ui/index.ts';
import type {
  HomeAgendaItem,
  HomeAssistedPerson,
} from '../home.view-model.ts';
import { formatPersonName } from '../home.view-model.ts';
import { useTranslations } from '../../../i18n/index.ts';
import { ActivityTimeline } from './ActivityTimeline.tsx';
import { AssistedPersonSelector } from './AssistedPersonSelector.tsx';

interface AssistedPersonPanelProps {
  readonly person: HomeAssistedPerson | null;
  readonly persons: readonly HomeAssistedPerson[];
  readonly selectedId: number | null;
  readonly agenda: readonly HomeAgendaItem[];
  readonly onSelect: (id: number) => void;
}

/** Principal card that groups the assisted person and today's timeline. */
export function AssistedPersonPanel({
  person,
  persons,
  selectedId,
  agenda,
  onSelect,
}: AssistedPersonPanelProps) {
  const t = useTranslations();
  const assistedPersonRoute = getNavItem('assistedPerson').route;
  const activitiesRoute = getNavItem('activities').route;
  const countLabel =
    agenda.length === 1
      ? t.home.panel.scheduledActivity
      : t.home.panel.scheduledActivities;

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-3 bg-alivia-primary-mist px-4 py-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-alivia-primary">
          <Icon name="assistedPerson" className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <SectionLabel>{t.home.panel.assistedPersonLabel}</SectionLabel>
          <p className="truncate font-semibold text-alivia-primary">
            {person ? formatPersonName(person.name) : '—'}
          </p>
        </div>
        {person && (
          <ArrowLink to={assistedPersonRoute} className="shrink-0">
            {t.home.panel.viewProfile}
          </ArrowLink>
        )}
      </div>

      <div className="p-4 sm:p-5">
        {person ? (
          <>
            <AssistedPersonSelector
              persons={persons}
              selectedId={selectedId}
              onSelect={onSelect}
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-alivia-primary">
                {t.home.panel.today}
              </h2>
              <Chip>
                {countLabel.replace('{count}', String(agenda.length))}
              </Chip>
            </div>
            {agenda.length > 0 ? (
              <ActivityTimeline items={agenda} />
            ) : (
              <p className="mt-4 text-sm text-alivia-text-soft">
                {t.home.panel.emptyAgenda}
              </p>
            )}
            <div className="mt-4 border-t border-alivia-primary-mist pt-1">
              <ArrowLink to={activitiesRoute}>
                {t.home.panel.viewAgenda}
              </ArrowLink>
            </div>
          </>
        ) : (
          <EmptyState
            title={t.home.panel.emptyTitle}
            action={
              <ArrowLink to={assistedPersonRoute}>
                {t.home.panel.emptyAction}
              </ArrowLink>
            }
          />
        )}
      </div>
    </Card>
  );
}
