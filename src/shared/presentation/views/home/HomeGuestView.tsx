import { Icon } from '@/shared/presentation/components/navigator/Icon.tsx';
import { ErrorState } from '@/shared/presentation/components/ui/index.ts';
import { useLocale } from '@/shared/presentation/i18n/index.ts';
import { HomeGuestLoadingState } from './components/HomeLoadingState.tsx';
import { NextActivityCard } from './components/NextActivityCard.tsx';
import { formatLongDate, todayInBusinessZone } from './home.dates.ts';
import {
  findAssistedPerson,
  formatPersonName,
} from './home.view-model.ts';
import { useTranslations } from '../../i18n/index.ts';
import { useHomeSummary } from './useHomeSummary.ts';

const PAGE_CLASSES = '-m-4 min-h-full bg-alivia-page p-4 sm:p-6';
const CONTENT_CLASSES = 'mx-auto w-full max-w-[36rem]';

/** Guest caregiver Home: welcome and the next assigned activity. */
export function HomeGuestView() {
  const { status, data, retry } = useHomeSummary('invitado');
  const t = useTranslations();
  const { locale } = useLocale();
  const today = todayInBusinessZone();

  if (status === 'loading') {
    return (
      <div className={PAGE_CLASSES}>
        <div className={CONTENT_CLASSES}>
          <HomeGuestLoadingState />
        </div>
      </div>
    );
  }
  if (status === 'error' || data === null) {
    return (
      <div className={PAGE_CLASSES}>
        <div className={CONTENT_CLASSES}>
          <ErrorState
            title={t.home.states.errorTitle}
            message={t.home.states.errorMessage}
            retryLabel={t.home.states.retry}
            onRetry={retry}
          />
        </div>
      </div>
    );
  }

  const userName = data.greeting.name.firstName.trim();
  const title = userName
    ? t.home.greeting.hello.replace('{name}', userName)
    : t.home.greeting.helloNoName;
  const assistedPerson = findAssistedPerson(
    data.assistedPersons,
    data.selectedAssistedPersonId,
  );
  const assistedPersonName = assistedPerson
    ? formatPersonName(assistedPerson.name)
    : '';

  return (
    <div className={PAGE_CLASSES}>
      <div className={`${CONTENT_CLASSES} space-y-5`}>
        {/* Greeting first, then the card: the skeleton's two blocks settle in reading order. */}
        <header className="animate-reveal space-y-3">
          <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-alivia-text-soft uppercase">
            <Icon name="calendar" className="size-4 shrink-0" />
            <span>{formatLongDate(today, locale).toLocaleUpperCase(locale)}</span>
          </p>
          <h1 className="text-3xl font-bold text-alivia-primary">{title}</h1>
          <div className="space-y-1 text-sm text-alivia-text-muted">
            <p>{t.home.guest.welcome}</p>
            <p>{t.home.guest.nextActivityIntro}</p>
          </div>
          {assistedPersonName && (
            <p className="inline-flex min-h-9 items-center gap-2 rounded-full bg-alivia-primary-mist px-3 text-sm font-semibold text-alivia-secondary-deep">
              <Icon name="assistedPerson" className="size-4" />
              {t.home.guest.careFor.replace('{name}', assistedPersonName)}
            </p>
          )}
        </header>
        <div className="animate-reveal [animation-delay:60ms]">
          <NextActivityCard
            activity={data.nextActivity}
            assistedPersonName={assistedPersonName}
          />
        </div>
      </div>
    </div>
  );
}
