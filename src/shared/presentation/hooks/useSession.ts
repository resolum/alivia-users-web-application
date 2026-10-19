import { useContext } from 'react';
import { SessionContext } from '../session/session.context.ts';
import type { SessionState } from '../session/session.types.ts';

/**
 * Returns the current session state.
 * Must be called inside a SessionProvider tree.
 */
export function useSession(): SessionState {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}
