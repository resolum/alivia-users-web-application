import { describe, expect, it, vi } from 'vitest';

vi.mock('../infrastructure/iam-api.ts', () => ({
  getIamApi: vi.fn(() => Promise.resolve({ logout: vi.fn(() => Promise.resolve()) })),
}));
vi.mock('../infrastructure/iam-session.storage.ts', async (original) => ({
  ...(await original<typeof import('../infrastructure/iam-session.storage.ts')>()),
  readStoredSession: vi.fn(() => null),
  clearSessionTokens: vi.fn(),
}));
vi.mock('../infrastructure/iam-registration.storage.ts', async (original) => ({
  ...(await original<typeof import('../infrastructure/iam-registration.storage.ts')>()),
  clearRegistrationProgress: vi.fn(),
}));

import { clearRegistrationProgress } from '../infrastructure/iam-registration.storage.ts';
import { clearSessionTokens } from '../infrastructure/iam-session.storage.ts';
import { iamStore, onSignedOut, signOut } from './iam.store.ts';

describe('signOut', () => {
  it('closes the session, forgets the registration and lets other contexts clean up', () => {
    const cleanup = vi.fn();
    const unregister = onSignedOut(cleanup);

    signOut();

    expect(clearSessionTokens).toHaveBeenCalled();
    expect(clearRegistrationProgress).toHaveBeenCalled();
    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(iamStore.getState().status).toBe('unauthenticated');

    unregister();
    signOut();
    expect(cleanup).toHaveBeenCalledTimes(1);
  });
});
