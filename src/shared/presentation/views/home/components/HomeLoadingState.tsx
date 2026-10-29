import { useTranslations } from '../../../i18n/index.ts';

/** Accessible skeleton shown while the Home read model loads. */
export function HomeLoadingState() {
  const t = useTranslations();

  return (
    <div
      aria-busy="true"
      aria-label={t.home.states.loading}
      className="space-y-6"
    >
      <span className="sr-only">{t.home.states.loading}</span>
      <div className="h-24 animate-pulse rounded-2xl bg-alivia-primary-mist" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="h-72 animate-pulse rounded-2xl bg-alivia-primary-mist lg:col-span-2" />
        <div className="h-72 animate-pulse rounded-2xl bg-alivia-primary-mist" />
      </div>
    </div>
  );
}
