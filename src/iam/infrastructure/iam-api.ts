import { SessionExpiredError } from '@/shared/infrastructure/base-api.ts';
import type { AuthTokens } from '@/shared/infrastructure/token-storage.ts';
import type { Account } from '../domain/model/account.entity.ts';
import type { AuthSession } from '../domain/model/auth-session.ts';
import type { CreateHouseholdAccountCommand } from '../domain/model/create-household-account.command.ts';
import type { ForgotPasswordCommand } from '../domain/model/forgot-password.command.ts';
import type { HouseholdAccount } from '../domain/model/household-account.entity.ts';
import { IamError } from '../domain/model/iam-error.ts';
import type { ResendVerificationCommand } from '../domain/model/resend-verification.command.ts';
import type { DefinePasswordCommand } from '../domain/model/reset-password.command.ts';
import type { SignInCommand } from '../domain/model/sign-in.command.ts';
import type { SignUpCommand } from '../domain/model/sign-up.command.ts';
import type { VerifyEmailCommand } from '../domain/model/verify-email.command.ts';
import { HouseholdAccountApiEndpoint } from './household/household-account-api-endpoint.ts';
import { LogoutApiEndpoint } from './logout/logout-api-endpoint.ts';
import { PasswordRecoveryApiEndpoint } from './password-recovery/password-recovery-api-endpoint.ts';
import { RefreshApiEndpoint } from './refresh/refresh-api-endpoint.ts';
import { ResendVerificationApiEndpoint } from './resend-verification/resend-verification-api-endpoint.ts';
import { SignInApiEndpoint } from './sign-in/sign-in-api-endpoint.ts';
import { SignUpApiEndpoint } from './sign-up/sign-up-api-endpoint.ts';
import { VerifyEmailApiEndpoint } from './verify-email/verify-email-api-endpoint.ts';

/**
 * IamApi
 * Infrastructure API facade for IAM operations.
 * Delegates transport work to the endpoint classes.
 */
export interface IamApi {
  readonly signUp: (command: SignUpCommand) => Promise<Account>;
  readonly verifyEmail: (command: VerifyEmailCommand) => Promise<Account>;
  readonly resendVerification: (command: ResendVerificationCommand) => Promise<void>;
  readonly signIn: (command: SignInCommand) => Promise<AuthSession>;
  readonly refreshSession: (refreshToken: string) => Promise<AuthTokens>;
  readonly logout: (refreshToken: string) => Promise<void>;
  readonly requestPasswordReset: (command: ForgotPasswordCommand) => Promise<void>;
  readonly resetPassword: (command: DefinePasswordCommand) => Promise<void>;
  readonly createHouseholdAccount: (
    command: CreateHouseholdAccountCommand,
  ) => Promise<HouseholdAccount>;
}

const signUpEndpoint = new SignUpApiEndpoint();
const verifyEmailEndpoint = new VerifyEmailApiEndpoint();
const resendVerificationEndpoint = new ResendVerificationApiEndpoint();
const signInEndpoint = new SignInApiEndpoint();
const refreshEndpoint = new RefreshApiEndpoint();
const logoutEndpoint = new LogoutApiEndpoint();
const passwordRecoveryEndpoint = new PasswordRecoveryApiEndpoint();
const householdAccountEndpoint = new HouseholdAccountApiEndpoint();

async function run<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof IamError) throw error;
    if (error instanceof SessionExpiredError) {
      throw new IamError({
        code: 'unknown',
        detail: 'Session expired',
        cause: error,
      });
    }
    if (error instanceof TypeError) {
      throw new IamError({ code: 'network', cause: error });
    }
    throw new IamError({ code: 'unknown', cause: error });
  }
}

/** HTTP implementation of IamApi. */
const httpIamApi: IamApi = {
  signUp: (command) => run(() => signUpEndpoint.signUp(command)),
  verifyEmail: (command) => run(() => verifyEmailEndpoint.verifyEmail(command)),
  resendVerification: (command) =>
    run(() => resendVerificationEndpoint.resendVerification(command)),
  signIn: (command) => run(() => signInEndpoint.signIn(command)),
  refreshSession: (refreshToken) => run(() => refreshEndpoint.refresh(refreshToken)),
  logout: (refreshToken) => run(() => logoutEndpoint.logout(refreshToken)),
  requestPasswordReset: (command) =>
    run(() => passwordRecoveryEndpoint.requestPasswordReset(command)),
  resetPassword: (command) =>
    run(() => passwordRecoveryEndpoint.resetPassword(command)),
  createHouseholdAccount: (command) =>
    run(() => householdAccountEndpoint.create(command)),
};

interface EnvironmentSetting {
  readonly name: string;
  readonly value: string;
}

/** Settings required by the backend auth endpoints, defined in .env.development. */
function missingHttpSettings(): string[] {
  const env = import.meta.env;
  const settings: readonly EnvironmentSetting[] = [
    { name: 'VITE_API_BASE_URL', value: env.VITE_API_BASE_URL ?? '' },
    { name: 'VITE_IAM_SIGN_UP_ENDPOINT_PATH', value: env.VITE_IAM_SIGN_UP_ENDPOINT_PATH ?? '' },
    { name: 'VITE_IAM_VERIFY_EMAIL_ENDPOINT_PATH', value: env.VITE_IAM_VERIFY_EMAIL_ENDPOINT_PATH ?? '' },
    {
      name: 'VITE_IAM_RESEND_VERIFICATION_ENDPOINT_PATH',
      value: env.VITE_IAM_RESEND_VERIFICATION_ENDPOINT_PATH ?? '',
    },
    { name: 'VITE_IAM_SIGN_IN_ENDPOINT_PATH', value: env.VITE_IAM_SIGN_IN_ENDPOINT_PATH ?? '' },
    { name: 'VITE_IAM_REFRESH_ENDPOINT_PATH', value: env.VITE_IAM_REFRESH_ENDPOINT_PATH ?? '' },
    { name: 'VITE_IAM_LOGOUT_ENDPOINT_PATH', value: env.VITE_IAM_LOGOUT_ENDPOINT_PATH ?? '' },
  ];
  return settings
    .filter((setting) => setting.value.trim() === '')
    .map((setting) => setting.name);
}

function assertHttpConfiguration(): void {
  const missing = missingHttpSettings();
  if (missing.length > 0) {
    throw new IamError({
      code: 'configuration',
      detail: `Missing IAM environment variables: ${missing.join(', ')}`,
    });
  }
}

async function createApi(): Promise<IamApi> {
  assertHttpConfiguration();
  return httpIamApi;
}

let cachedApi: Promise<IamApi> | null = null;

export function getIamApi(): Promise<IamApi> {
  if (cachedApi === null) {
    cachedApi = createApi();
  }
  return cachedApi;
}
