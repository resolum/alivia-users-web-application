import { useMemo, useState, type ReactNode } from 'react';
import { es } from './es.ts';
import { en } from './en.ts';
import { LocaleContext } from './locale.context.ts';
import type { Translations } from './es.ts';

export type Locale = 'es' | 'en';

const dictionaries: Record<Locale, Translations> = { es, en };

/** Provides locale state and translations to the tree. */
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('es');
  const t = useMemo(() => dictionaries[locale], [locale]);
  const value = useMemo(() => ({ locale, setLocale, t }), [locale, t]);
  return <LocaleContext value={value}>{children}</LocaleContext>;
}
