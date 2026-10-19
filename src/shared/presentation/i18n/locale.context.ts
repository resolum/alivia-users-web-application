import { createContext } from 'react';
import type { Locale } from './locale.provider.tsx';
import type { Translations } from './es.ts';

export interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translations;
}

export const LocaleContext = createContext<LocaleContextValue | null>(null);
