import { useMemo, type ReactNode } from 'react';
import {
  SessionProvider,
  type SessionState,
} from '@/shared/presentation/session/index.ts';
import { signOut } from '../application/iam.store.ts';
import { useIamSession } from './hooks/useIamSession.ts';

interface IamSessionProviderProps {
  readonly children: ReactNode;
}

export function IamSessionProvider({ children }: IamSessionProviderProps) {
  const { status, user } = useIamSession();

  const value: SessionState = useMemo(
    () => ({
      status,
      user:
        user === null
          ? null
          : {
              id: user.id.getValue(),
              displayName: user.emailAddress.value,
              profileId: user.profileId,
            },
      accessLevel: user?.portalAccessLevel ?? 'invitado',
      signOut,
    }),
    [status, user],
  );

  return <SessionProvider value={value}>{children}</SessionProvider>;
}
