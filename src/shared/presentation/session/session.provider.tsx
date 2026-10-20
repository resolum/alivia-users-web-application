import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { SessionContext } from './session.context.ts';
import type { AccessLevel, SessionState } from './session.types.ts';

/**
 * Temporary session provider that reads the access level from VITE_DEV_ROLE.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const devRole = import.meta.env.VITE_DEV_ROLE;
  const accessLevel: AccessLevel =
    devRole === 'invitado' ? 'invitado' : 'principal';
  const [signedOut, setSignedOut] = useState(false);

  const signOut = useCallback(() => {
    setSignedOut(true);
    window.location.assign('/sign-in');
  }, []);

  const value: SessionState = useMemo(
    () => ({
      status: signedOut ? 'unauthenticated' : 'authenticated',
      user: signedOut
        ? null
        : { id: 'dev-user', displayName: 'Usuario de desarrollo' },
      accessLevel,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      can: (_permission: string) => accessLevel === 'principal',
      signOut,
    }),
    [accessLevel, signedOut, signOut],
  );

  return (
    <SessionContext value={value}>
      {children}
    </SessionContext>
  );
}
