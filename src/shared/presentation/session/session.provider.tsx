import type { ReactNode } from 'react';
import { SessionContext } from './session.context.ts';
import type { SessionState } from './session.types.ts';

interface SessionProviderProps {
  readonly value: SessionState;
  readonly children: ReactNode;
}

export function SessionProvider({ value, children }: SessionProviderProps) {
  return <SessionContext value={value}>{children}</SessionContext>;
}
