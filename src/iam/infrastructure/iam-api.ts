import { SessionExpiredError } from '@/shared/infrastructure/base-api.ts';
import type { AuthTokens } from '@/shared/infrastructure/token-storage.ts';
import type { AuthSession } from '../domain/model/auth-session.ts';
import type { ForgotPasswordCommand } from '../domain/model/forgot-password.command.ts';
import { IamError } from '../domain/model/iam-error.ts';
import type { DefinePasswordCommand } from '../domain/model/reset-password.command.ts';
import type { SignInCommand } from '../domain/model/sign-in.command.ts';
import { PasswordRecoveryApiEndpoint } from './password-recovery/password-recovery-api-endpoint.ts';
import { RefreshApiEndpoint } from './refresh/refresh-api-endpoint.ts';
import { SignInApiEndpoint } from './sign-in/sign-in-api-endpoint.ts';

/**
 * IamApi
 * Infrastructure API facade for IAM operations.
 * Delegates transport work to the endpoint classes.
 */
export interface IamApi {
  readonly signIn: (command: SignInCommand) => Promise<AuthSession>;
  readonly refreshSession: (refreshToken: string) => Promise<AuthTokens>;
  readonly requestPasswordReset: (command: ForgotPasswordCommand) => Promise<void>;
  readonly resetPassword: (command: DefinePasswordCommand) => Promise<void>;
}

const signInEndpoint = new SignInApiEndpoint();
const refreshEndpoint = new RefreshApiEndpoint();
const passwordRecoveryEndpoint = new PasswordRecoveryApiEndpoint();

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
  signIn: (command) => run(() => signInEndpoint.signIn(command)),
  refreshSession: (refreshToken) => run(() => refreshEndpoint.refresh(refreshToken)),
  requestPasswordReset: (command) =>
    run(() => passwordRecoveryEndpoint.requestPasswordReset(command)),
  resetPassword: (command) =>
    run(() => passwordRecoveryEndpoint.resetPassword(command)),
};

interface EnvironmentSetting {
  readonly name: string;
  readonly value: string;
}

function missingHttpSettings(): string[] {
  const settings: readonly EnvironmentSetting[] = [
    { name: 'VITE_API_BASE_URL', value: import.meta.env.VITE_API_BASE_URL ?? '' },
    {
      name: 'VITE_IAM_SIGN_IN_ENDPOINT_PATH',
      value: import.meta.env.VITE_IAM_SIGN_IN_ENDPOINT_PATH ?? '',
    },
    {
      name: 'VITE_IAM_REFRESH_ENDPOINT_PATH',
      value: import.meta.env.VITE_IAM_REFRESH_ENDPOINT_PATH ?? '',
    },
    {
      name: 'VITE_IAM_FORGOT_PASSWORD_ENDPOINT_PATH',
      value: import.meta.env.VITE_IAM_FORGOT_PASSWORD_ENDPOINT_PATH ?? '',
    },
    {
      name: 'VITE_IAM_RESET_PASSWORD_ENDPOINT_PATH',
      value: import.meta.env.VITE_IAM_RESET_PASSWORD_ENDPOINT_PATH ?? '',
    },
  ];
  const missing: string[] = [];
  for (const setting of settings) {
    if (setting.value.trim() === '') {
      missing.push(setting.name);
    }
  }
  return missing;
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

const USE_MOCK = import.meta.env.VITE_IAM_MOCK === 'true';

async function createApi(): Promise<IamApi> {
  if (USE_MOCK) {
    const module = await import('./iam-mock-api.ts');
    return module.iamMockApi;
  }

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
