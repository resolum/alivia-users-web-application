import { useContext } from 'react';
import { LocaleContext } from './locale.context.ts';
import type { LocaleContextValue } from './locale.context.ts';
import type { Translations } from './es.ts';

/** Returns the current locale, setter and typed translation object. */
export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used inside LocaleProvider');
  return ctx;
}

/** Shorthand: returns only the translation object for the current locale. */
export function useTranslations(): Translations {
  return useLocale().t;
}
