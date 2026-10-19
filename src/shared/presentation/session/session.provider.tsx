import { useMemo, type ReactNode } from 'react';
import { SessionContext } from './session.context.ts';
import type { AccessLevel, SessionState } from './session.types.ts';

/**
 * Temporary session provider that reads the access level from VITE_DEV_ROLE.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const devRole = import.meta.env.VITE_DEV_ROLE;
  const accessLevel: AccessLevel =
    devRole === 'invitado' ? 'invitado' : 'principal';

  const value: SessionState = useMemo(
    () => ({
      status: 'authenticated' as const,
      user: {
        id: 'dev-user',
        displayName: 'Usuario de desarrollo',
      },
      accessLevel,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      can: (_permission: string) => accessLevel === 'principal',
    }),
    [accessLevel],
  );

  return (
    <SessionContext value={value}>
      {children}
    </SessionContext>
  );
}
