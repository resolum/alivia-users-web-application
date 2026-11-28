import type { RegistrationProgress } from '../infrastructure/iam-registration.storage.ts';
import type { IamStatus } from './iam.store.ts';

/** Where the sign-up step sends a visitor: back into a registration in progress, or to a fresh one. */
export type RegistrationEntry =
  | { readonly kind: 'resume'; readonly to: string }
  | { readonly kind: 'fresh'; readonly discardStale: boolean };

/**
 * Decides the sign-up step from the stored progress and the session.
 *
 * Only a signed-in account resumes its household steps. Progress that already reached the verified account or
 * the household but has no session belongs to an account that signed out or no longer exists (for example after a
 * local database reset): resuming it would skip the account step and fail on the household calls, so the visitor
 * starts a fresh registration and the stale progress is discarded.
 */
export function registrationEntry(
  progress: RegistrationProgress | null,
  sessionStatus: IamStatus,
): RegistrationEntry {
  if (sessionStatus === 'authenticated' && progress?.householdId) {
    return { kind: 'resume', to: progress.assistedPersonId ? '/contract/configuration' : '/household/assisted-person' };
  }
  const stale = sessionStatus === 'unauthenticated' && progress !== null
    && (progress.householdId !== null || progress.emailVerified);
  return { kind: 'fresh', discardStale: stale };
}
