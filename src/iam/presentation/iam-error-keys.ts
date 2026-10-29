import type { Translations } from '@/shared/presentation/i18n/index.ts';
import { IamError, type IamErrorCode } from '../domain/model/iam-error.ts';

export type IamErrorKey = keyof Translations['iam']['errors'];

const IAM_ERROR_KEYS: Readonly<Record<IamErrorCode, IamErrorKey>> = {
  invalid_credentials: 'invalidCredentials',
  email_not_verified: 'emailNotVerified',
  account_pending: 'accountPending',
  account_blocked: 'accountBlocked',
  account_deactivated: 'accountDeactivated',
  email_already_registered: 'emailAlreadyRegistered',
  email_already_verified: 'emailAlreadyVerified',
  invalid_verification_code: 'invalidVerificationCode',
  verification_code_expired: 'verificationCodeExpired',
  invalid_password_token: 'invalidPasswordToken',
  password_token_expired: 'passwordTokenExpired',
  role_not_allowed: 'roleNotAllowed',
  rate_limited: 'rateLimited',
  validation_failed: 'validationFailed',
  service_unavailable: 'serviceUnavailable',
  network: 'network',
  configuration: 'configuration',
  unknown: 'unknown',
};

export function toIamErrorKey(error: unknown): IamErrorKey {
  if (error instanceof IamError) return IAM_ERROR_KEYS[error.code];
  return IAM_ERROR_KEYS.unknown;
}
