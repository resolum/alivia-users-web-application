import { useState } from 'react';
import { ErrorState } from '@/shared/presentation/components/ui/index.ts';
import { useLocale } from '@/shared/presentation/i18n/index.ts';
import { AssistedPersonPanel } from './components/AssistedPersonPanel.tsx';
import { DeviceAlertBanner } from './components/DeviceAlertBanner.tsx';
import { HomeHeader } from './components/HomeHeader.tsx';
import { HomeLoadingState } from './components/HomeLoadingState.tsx';
import { UpcomingEventCard } from './components/UpcomingEventCard.tsx';
import { formatLongDate, todayInBusinessZone } from './home.dates.ts';
import {
  findAssistedPerson,
  type HomeAssistedPerson,
} from './home.view-model.ts';
import { useTranslations } from '../../i18n/index.ts';
import {
  readAssistedPersonId,
  useAssistedPersonSelection,
} from './useAssistedPersonSelection.ts';
import { useHomeSummary } from './useHomeSummary.ts';

const EMPTY_PERSONS: readonly HomeAssistedPerson[] = [];
const PAGE_CLASSES =
  '-m-4 min-h-full bg-alivia-page p-4 lg:-m-6 lg:p-6';

/** Principal caregiver Home: summary, alert and today's care timeline. */
export function HomePrincipalView() {
  const [initialPersonId] = useState<number | null>(readAssistedPersonId);
  const { status, data, retry } = useHomeSummary(
    'principal',
    initialPersonId ?? undefined,
  );
  const t = useTranslations();
  const { locale } = useLocale();
  const persons = data?.assistedPersons ?? EMPTY_PERSONS;
  const selection = useAssistedPersonSelection(persons);
  const selectedPerson = findAssistedPerson(persons, selection.selectedId);
  const today = todayInBusinessZone();
  const handleSelect = (id: number) => {
    selection.select(id);
    retry(id);
  };

  if (status === 'loading') {
    return (
      <div className={PAGE_CLASSES}>
        <HomeLoadingState />
      </div>
    );
  }
  if (status === 'error' || data === null) {
    return (
      <div className={PAGE_CLASSES}>
        <ErrorState
          title={t.home.states.errorTitle}
          message={t.home.states.errorMessage}
          retryLabel={t.home.states.retry}
          onRetry={retry}
        />
      </div>
    );
  }

  return (
    <div className={PAGE_CLASSES}>
      <div className="reveal-stagger space-y-6">
        <HomeHeader
          greeting={data.greeting}
          dateLabel={formatLongDate(today, locale)}
        />
        {data.deviceAlert && <DeviceAlertBanner alert={data.deviceAlert} />}
        <div className="grid gap-6 lg:grid-cols-3">
          <div
            className={
              data.upcomingEvent ? 'lg:col-span-2' : 'lg:col-span-3'
            }
          >
            <AssistedPersonPanel
              person={selectedPerson}
              persons={persons}
              selectedId={selection.selectedId}
              agenda={data.todayAgenda}
              onSelect={handleSelect}
            />
          </div>
          {data.upcomingEvent && (
            <UpcomingEventCard event={data.upcomingEvent} />
          )}
        </div>
      </div>
    </div>
  );
}
