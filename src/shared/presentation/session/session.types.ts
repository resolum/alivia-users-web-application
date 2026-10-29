/**
 * Access level for authenticated users.
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
  readonly id: string;
  readonly displayName: string;
  /** Linked person profile, or null when the backend has not linked one. */
  readonly profileId: string | null;
}

export interface SessionState {
  readonly status: SessionStatus;
  readonly user: SessionUser | null;
  readonly accessLevel: AccessLevel;
  readonly signOut: () => void;
}
