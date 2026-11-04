import type { ReactNode } from 'react';
import { IamSessionProvider } from '@/iam/index.ts';
import { registerSignOutCleanup } from './sign-out-cleanup.ts';
import { LocaleProvider } from '@/shared/presentation/i18n/index.ts';

interface ProvidersProps {
  readonly children: ReactNode;
}

registerSignOutCleanup();

export function Providers({ children }: ProvidersProps) {
  return (
    <LocaleProvider>
      <IamSessionProvider>{children}</IamSessionProvider>
    </LocaleProvider>
  );
}