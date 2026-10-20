import { useLocale, useTranslations } from '../../i18n/index.ts';
import type { Locale } from '../../i18n/index.ts';

const localeLabels: Record<Locale, string> = { es: 'ES', en: 'EN' };

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();
  const t = useTranslations();
  const locales: Locale[] = ['es', 'en'];

  return (
    <div
      role="group"
      aria-label={t.nav.language}
      className="flex items-center gap-1"
    >
      {locales.map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={locale === l}
          onClick={() => setLocale(l)}
          className={[
            'flex min-h-11 min-w-11 items-center justify-center rounded-lg px-2 text-xs font-semibold transition-colors duration-150',
            locale === l
              ? 'bg-alivia-primary text-white'
              : 'text-alivia-text-muted hover:bg-alivia-primary-mist',
          ].join(' ')}
        >
          {localeLabels[l]}
        </button>
      ))}
    </div>
  );
}
