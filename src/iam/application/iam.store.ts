import { BaseApi } from '@/shared/infrastructure/base-api.ts';
import type {
  ForgotPasswordCommand,
} from '../domain/model/forgot-password.command.ts';
import { IamError } from '../domain/model/iam-error.ts';
import type { DefinePasswordCommand } from '../domain/model/reset-password.command.ts';
import type { SignInCommand } from '../domain/model/sign-in.command.ts';
import type { User } from '../domain/model/user.entity.ts';
import { getIamApi } from '../infrastructure/iam-api.ts';
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

/** Clears the session locally. Route guards perform the redirect. */
export function signOut(): void {
  clearSessionTokens();
  setUnauthenticated();
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
