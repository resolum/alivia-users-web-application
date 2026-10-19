import { createContext } from 'react';
import type { SessionState } from './session.types.ts';

export const SessionContext = createContext<SessionState | null>(null);