import type { SignInResponse } from '../sign-in/sign-in.response.ts';

/** Verification now opens a session, using the same contract as sign-in. */
export type VerifyEmailResponse = SignInResponse;
