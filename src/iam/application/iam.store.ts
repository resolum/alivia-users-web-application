import { BaseApi } from '@/shared/infrastructure/base-api.ts';
import type { Account } from '../domain/model/account.entity.ts';
import type { CreateHouseholdAccountCommand } from '../domain/model/create-household-account.command.ts';
import type { FieldErrorCode } from '../domain/model/field-errors.ts';
import type {
  ForgotPasswordCommand,
} from '../domain/model/forgot-password.command.ts';
import type { HouseholdAccount } from '../domain/model/household-account.entity.ts';
import { IamError } from '../domain/model/iam-error.ts';
import type { RegisterAssistedPersonCommand } from '../domain/model/register-assisted-person.command.ts';
import type { ResendVerificationCommand } from '../domain/model/resend-verification.command.ts';
import type { ResetPasswordCommand } from '../domain/model/reset-password.command.ts';
import type { ChangePasswordCommand } from '../domain/model/change-password.command.ts';
import type { SignInCommand } from '../domain/model/sign-in.command.ts';
import type { SignUpCommand } from '../domain/model/sign-up.command.ts';
import type { User } from '../domain/model/user.entity.ts';
import type { VerifyEmailCommand } from '../domain/model/verify-email.command.ts';
import { getIamApi } from '../infrastructure/iam-api.ts';
import {
  clearRegistrationProgress,
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

/** Renews the browser session before entering a protected area after a long contracting flow. */
export async function refreshCurrentSession(): Promise<void> {
  const stored = readStoredSession();
  if (stored === null || stored.user === null) {
    handleSessionExpired();
    throw new IamError({ code: 'unknown', detail: 'Missing stored session' });
  }
  try {
    await refreshStoredSession();
    setState({ status: 'authenticated', user: stored.user });
  } catch (error) {
    handleSessionExpired();
    throw error;
  }
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
const signOutListeners = new Set<() => void>();

/**
 * Runs `listener` every time the user signs out on purpose, so other contexts can drop what they keep in the
 * browser for that account (for example, an unfinished contracting). Returns the function that unregisters it.
 */
export function onSignedOut(listener: () => void): () => void {
  signOutListeners.add(listener);
  return () => signOutListeners.delete(listener);
}

/**
 * Closes the session and forgets the registration in progress, so "Conoce nuestros planes" starts a new
 * contracting from the plan instead of resuming the previous account's one.
 */
export function signOut(): void {
  const refreshToken = readStoredSession()?.tokens.refreshToken ?? null;
  clearSessionTokens();
  clearRegistrationProgress();
  setUnauthenticated();
  signOutListeners.forEach((listener) => listener());
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

/** Sets a new password with the emailed code without changing session state. */
export async function resetPassword(command: ResetPasswordCommand): Promise<void> {
  const api = await getIamApi();
  await api.resetPassword(command);
}

/** Changes the password of the signed-in user; the session stays open. */
export async function changePassword(command: ChangePasswordCommand): Promise<void> {
  const api = await getIamApi();
  await api.changePassword(command);
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

/** Verifies the email with the 6-digit code sent to it and opens the session. */
export async function verifyEmail(command: VerifyEmailCommand): Promise<void> {
  assertValid(command.validate());
  const api = await getIamApi();
  const session = await api.verifyEmail(command);
  const refreshToken = session.refreshToken;
  if (refreshToken === null) {
    throw new IamError({
      code: 'unknown',
      detail: 'The email verification response did not include a refresh token',
    });
  }

  // Email verification is the authentication hand-off for the contracting
  // flow. Persist it so a new tab and the later activation step can renew it.
  saveSession(
    { accessToken: session.accessToken, refreshToken },
    true,
    session.user,
  );
  setState({ status: 'authenticated', user: session.user });
  saveRegistrationProgress({
    accountId: session.user.id.getValue(),
    emailVerified: true,
  });
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
  saveRegistrationProgress({ householdId: household.id, assistedPersonId: null });
  return household;
}

/**
 * Registers who will use Alivia in the household created in the previous
 * substep of the contracting flow.
 * @param command - The assisted person data.
 * @returns The identifier of the assisted person.
 */
export async function registerAssistedPerson(
  command: RegisterAssistedPersonCommand,
): Promise<string> {
  assertValid(command.validate());

  const householdId = readRegistrationProgress()?.householdId ?? null;
  if (householdId === null) {
    throw new IamError({ code: 'unknown', detail: 'Missing household for the assisted person' });
  }

  const api = await getIamApi();
  const assistedPersonId = await api.registerAssistedPerson(householdId, command);
  saveRegistrationProgress({ assistedPersonId });
  return assistedPersonId;
}
