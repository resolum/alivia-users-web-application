import { BaseApi } from '@/shared/infrastructure/base-api.ts';
import type { Account } from '../domain/model/account.entity.ts';
import type { CreateHouseholdAccountCommand } from '../domain/model/create-household-account.command.ts';
import type { FieldErrorCode } from '../domain/model/field-errors.ts';
import type {
  ForgotPasswordCommand,
} from '../domain/model/forgot-password.command.ts';
import type { HouseholdAccount } from '../domain/model/household-account.entity.ts';
import { IamError } from '../domain/model/iam-error.ts';
import type { ResendVerificationCommand } from '../domain/model/resend-verification.command.ts';
import type { DefinePasswordCommand } from '../domain/model/reset-password.command.ts';
import type { SignInCommand } from '../domain/model/sign-in.command.ts';
import type { SignUpCommand } from '../domain/model/sign-up.command.ts';
import type { User } from '../domain/model/user.entity.ts';
import type { VerifyEmailCommand } from '../domain/model/verify-email.command.ts';
import { getIamApi } from '../infrastructure/iam-api.ts';
import {
  readRegistrationProgress,
  saveRegistrationProgress,
  startRegistrationProgress,
  type RegistrationProgress,
} from '../infrastructure/iam-registration.storage.ts';
import {
  clearSessionTokens,
  readAccessToken,
  readStoredSession,
  saveRefreshedTokens,
  saveSession,
} from '../infrastructure/iam-session.storage.ts';

/** Session status consumed by presentation. */
export type IamStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface IamState {
  readonly status: IamStatus;
  readonly user: User | null;
}

type Listener = () => void;

const LOADING_STATE: IamState = { status: 'loading', user: null };
const UNAUTHENTICATED_STATE: IamState = { status: 'unauthenticated', user: null };

let state: IamState = LOADING_STATE;
const listeners = new Set<Listener>();

function setState(next: IamState): void {
  state = next;
  for (const listener of listeners) listener();
}

function setUnauthenticated(): void {
  if (state.status === 'unauthenticated' && state.user === null) return;
  setState(UNAUTHENTICATED_STATE);
}

/** Minimal external store read by useSyncExternalStore. */
export const iamStore = {
  getState(): IamState {
    return state;
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

async function refreshStoredSession(): Promise<void> {
  const stored = readStoredSession();
  if (stored === null) {
    throw new IamError({
      code: 'unknown',
      detail: 'Missing stored session',
    });
  }

  const api = await getIamApi();
  const tokens = await api.refreshSession(stored.tokens.refreshToken);
  saveRefreshedTokens(tokens);
}

function handleSessionExpired(): void {
  clearSessionTokens();
  setUnauthenticated();
}

function registerAuthHandlers(): void {
  BaseApi.registerAuthHandlers({
    getAccessToken: readAccessToken,
    refreshSession: refreshStoredSession,
    onSessionExpired: handleSessionExpired,
  });
}

async function restoreStoredSession(): Promise<void> {
  const stored = readStoredSession();
  if (stored === null || stored.user === null) {
    clearSessionTokens();
    setUnauthenticated();
    return;
  }

  try {
    const api = await getIamApi();
    const tokens = await api.refreshSession(stored.tokens.refreshToken);
    saveRefreshedTokens(tokens);
    setState({ status: 'authenticated', user: stored.user });
  } catch {
    clearSessionTokens();
    setUnauthenticated();
  }
}

let initialization: Promise<void> | null = null;

export function initIam(): Promise<void> {
  if (initialization !== null) return initialization;
  registerAuthHandlers();
  initialization = restoreStoredSession();
  return initialization;
}

/**
 * Authenticates the user and stores the session. It never navigates: route
 * guards react to the new state.
 */
export async function signIn(
  command: SignInCommand,
  remember: boolean,
): Promise<void> {
  const errors = command.validate();
  if (Object.keys(errors).length > 0) {
    throw new IamError({ code: 'invalid_credentials' });
  }

  const api = await getIamApi();
  const session = await api.signIn(command);
  const refreshToken = session.refreshToken;
  if (refreshToken === null) {
    throw new IamError({
      code: 'unknown',
      detail: 'The sign-in response did not include a refresh token',
    });
  }

  saveSession(
    { accessToken: session.accessToken, refreshToken },
    remember,
    session.user,
  );
  setState({ status: 'authenticated', user: session.user });
}

/**
 * Clears the session locally and invalidates the refresh token in the
 * backend. Route guards perform the redirect.
 */
export function signOut(): void {
  const refreshToken = readStoredSession()?.tokens.refreshToken ?? null;
  clearSessionTokens();
  setUnauthenticated();
  if (refreshToken === null) return;

  // The local session is already closed; a failed logout only leaves the
  // refresh token valid until it expires.
  void getIamApi()
    .then((api) => api.logout(refreshToken))
    .catch(() => undefined);
}

/** Requests recovery instructions without changing session state. */
export async function requestPasswordReset(command: ForgotPasswordCommand): Promise<void> {
  const api = await getIamApi();
  await api.requestPasswordReset(command);
}

/** Sets a new password without changing session state. */
export async function resetPassword(command: DefinePasswordCommand): Promise<void> {
  const api = await getIamApi();
  await api.resetPassword(command);
}

export type { RegistrationProgress };

function assertValid(errors: Partial<Record<string, FieldErrorCode>>): void {
  if (Object.keys(errors).length > 0) {
    const fieldErrors: Record<string, FieldErrorCode> = {};
    for (const [field, code] of Object.entries(errors)) {
      if (code !== undefined) fieldErrors[field] = code;
    }
    throw new IamError({ code: 'validation_failed', fieldErrors });
  }
}

/** Current registration progress of the responsible client, if any. */
export function getRegistrationProgress(): RegistrationProgress | null {
  return readRegistrationProgress();
}

/** Registers the responsible client and keeps the email for resending. */
export async function signUp(command: SignUpCommand): Promise<Account> {
  assertValid(command.validate());

  const api = await getIamApi();
  const account = await api.signUp(command);
  startRegistrationProgress({
    emailAddress: command.emailAddress.toLowerCase(),
    maskedEmail: account.maskedEmail,
    accountId: account.accountId,
  });
  return account;
}

// The token works only once, so a repeated call (React StrictMode, a double
// render) must reuse the first request instead of burning the token.
const verifications = new Map<string, Promise<void>>();

/** Verifies the email with the token of the link. */
export function verifyEmail(command: VerifyEmailCommand): Promise<void> {
  const pending = verifications.get(command.token);
  if (pending !== undefined) return pending;

  const request = (async () => {
    assertValid(command.validate());
    const api = await getIamApi();
    const account = await api.verifyEmail(command);
    saveRegistrationProgress({ accountId: account.accountId, emailVerified: true });
  })();
  verifications.set(command.token, request);
  return request;
}

/** Sends a new verification link to the registered email. */
export async function resendVerification(
  command: ResendVerificationCommand,
): Promise<void> {
  assertValid(command.validate());

  const api = await getIamApi();
  await api.resendVerification(command);
}

/**
 * Creates the shared household account. Only a responsible client whose email
 * was verified can create it.
 */
export async function createHouseholdAccount(
  command: CreateHouseholdAccountCommand,
): Promise<HouseholdAccount> {
  assertValid(command.validate());

  const progress = readRegistrationProgress();
  if (progress?.emailVerified !== true || progress.accountId !== command.responsibleAccountId) {
    throw new IamError({ code: 'email_not_verified' });
  }

  const api = await getIamApi();
  const household = await api.createHouseholdAccount(command);
  saveRegistrationProgress({ householdId: household.id });
  return household;
}
