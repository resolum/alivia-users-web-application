import type { ReactNode } from 'react';
import { SessionProvider } from '@/shared/presentation/session/index.ts';
import { LocaleProvider } from '@/shared/presentation/i18n/index.ts';

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Composes all app-level providers in the correct nesting order:
 * LocaleProvider → SessionProvider → children.
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <LocaleProvider>
      <SessionProvider>
        {children}
      </SessionProvider>
    </LocaleProvider>
  );
}
