import { useLocale } from '../../i18n/index.ts';
import type { Locale } from '../../i18n/index.ts';

const localeLabels: Record<Locale, string> = { es: 'ES', en: 'EN' };

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();
  const locales: Locale[] = ['es', 'en'];

  return (
    <div
      role="group"
      aria-label="Idioma"
      className="flex items-center gap-1"
    >
      {locales.map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={locale === l}
          onClick={() => setLocale(l)}
          className={[
            'px-2 py-1 rounded text-xs font-semibold transition-colors duration-150',
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
