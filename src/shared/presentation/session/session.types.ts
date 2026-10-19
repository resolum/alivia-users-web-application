/**
 * Access level for authenticated users.
 *
 * - `principal`: full access to all sections.
 * - `invitado`: restricted access to a subset of sections.
 */
export type AccessLevel = 'principal' | 'invitado';

/**
 * Authentication status of the current session.
 */
export type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

/**
 * Minimal user representation for the session.
 */
export interface SessionUser {
  id: string;
  displayName: string;
}

/**
 * Shape of the session context value.
 */
export interface SessionState {
  status: SessionStatus;
  user: SessionUser | null;
  accessLevel: AccessLevel;
  can: (permission: string) => boolean;
}
