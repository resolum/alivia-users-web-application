import { describe, expect, it } from 'vitest';
import type { RegistrationProgress } from '../infrastructure/iam-registration.storage.ts';
import { registrationEntry } from './registration-entry.ts';

const progress = (changes: Partial<RegistrationProgress> = {}): RegistrationProgress => ({
  emailAddress: 'ana@correo.pe',
  maskedEmail: 'a**@correo.pe',
  accountId: 'acc-1',
  emailVerified: false,
  householdId: null,
  assistedPersonId: null,
  ...changes,
});

describe('registrationEntry', () => {
  it('starts a fresh registration without progress', () => {
    expect(registrationEntry(null, 'unauthenticated')).toEqual({ kind: 'fresh', discardStale: false });
  });

  it('keeps an unverified sign-up so the code can still be entered or resent', () => {
    expect(registrationEntry(progress(), 'unauthenticated')).toEqual({ kind: 'fresh', discardStale: false });
  });

  it('does not skip the account step for household progress without a session, and discards it', () => {
    const stale = progress({ emailVerified: true, householdId: '12' });
    expect(registrationEntry(stale, 'unauthenticated')).toEqual({ kind: 'fresh', discardStale: true });
    expect(registrationEntry(progress({ emailVerified: true }), 'unauthenticated'))
      .toEqual({ kind: 'fresh', discardStale: true });
  });

  it('resumes the household steps of a signed-in account', () => {
    expect(registrationEntry(progress({ emailVerified: true, householdId: '12' }), 'authenticated'))
      .toEqual({ kind: 'resume', to: '/household/assisted-person' });
    expect(registrationEntry(progress({ emailVerified: true, householdId: '12', assistedPersonId: '5' }), 'authenticated'))
      .toEqual({ kind: 'resume', to: '/contract/configuration' });
  });

  it('decides nothing stale while the session is still loading', () => {
    expect(registrationEntry(progress({ householdId: '12' }), 'loading')).toEqual({ kind: 'fresh', discardStale: false });
  });
});
