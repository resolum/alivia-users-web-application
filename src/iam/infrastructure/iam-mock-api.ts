import type { AuthTokens } from '@/shared/infrastructure/token-storage.ts';
import type { AuthSession } from '../domain/model/auth-session.ts';
import type { Roles } from '../domain/model/iam.enums.ts';
import { IamError } from '../domain/model/iam-error.ts';
import type { DefinePasswordCommand } from '../domain/model/reset-password.command.ts';
import type { SignInCommand } from '../domain/model/sign-in.command.ts';
import { toSessionFromResource } from './iam.assembler.ts';
import { toIamErrorCode } from './iam-error.mapper.ts';
import type { IamApi } from './iam-api.ts';
import type { UserResource } from './iam.resources.ts';
import type { SignInResponse } from './sign-in/sign-in.response.ts';

const MOCK_DELAY_MS = 600;
const MOCK_EXPIRED_TOKEN = 'vencido';
const MOCK_USER_ID = 1;

function delay(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, MOCK_DELAY_MS);
  });
}

function forcedError(): IamError | null {
  const code = toIamErrorCode(import.meta.env.VITE_IAM_MOCK_FAIL ?? '');
  return code === null ? null : new IamError({ code });
}

function assertNoForcedError(): void {
  const error = forcedError();
  if (error !== null) throw error;
}

function createMockTokens(): AuthTokens {
  return {
    accessToken: crypto.randomUUID(),
    refreshToken: crypto.randomUUID(),
  };
}

function resolveMockRole(email: string): Roles {
  if (email.startsWith('invitado')) return 'ROLE_CAREGIVER';
  return import.meta.env.VITE_DEV_ROLE === 'invitado'
    ? 'ROLE_CAREGIVER'
    : 'ROLE_RELATIVE';
}

function createMockUserResource(email: string): UserResource {
  return {
    id: MOCK_USER_ID,
    emailAddress: email,
    accountType: 'PERSONAL',
    status: 'ACTIVE',
    roles: [resolveMockRole(email)],
    emailVerified: true,
  };
}

async function signIn(command: SignInCommand): Promise<AuthSession> {
  await delay();
  assertNoForcedError();

  const errors = command.validate();
  if (Object.keys(errors).length > 0) {
    throw new IamError({ code: 'invalid_credentials' });
  }

  const tokens = createMockTokens();
  const response: SignInResponse = {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    user: createMockUserResource(
      command.emailAddress.trim().toLowerCase(),
    ),
    permissions: [],
  };
  return toSessionFromResource(response);
}

async function refreshSession(refreshToken: string): Promise<AuthTokens> {
  await delay();
  assertNoForcedError();

  if (refreshToken.length === 0) {
    throw new IamError({ code: 'invalid_credentials' });
  }
  return createMockTokens();
}

async function requestPasswordReset(): Promise<void> {
  await delay();
  assertNoForcedError();
}

async function resetPassword(command: DefinePasswordCommand): Promise<void> {
  await delay();
  assertNoForcedError();

  if (command.token === MOCK_EXPIRED_TOKEN) {
    throw new IamError({ code: 'password_token_expired' });
  }
}

export const iamMockApi: IamApi = {
  signIn,
  refreshSession,
  requestPasswordReset,
  resetPassword,
};
