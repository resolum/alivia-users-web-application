import type { ReactNode } from 'react';
import { IamSessionProvider } from '@/iam/index.ts';
import { LocaleProvider } from '@/shared/presentation/i18n/index.ts';

interface ProvidersProps {
  readonly children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <LocaleProvider>
      <IamSessionProvider>{children}</IamSessionProvider>
    </LocaleProvider>
  );
}