import type { TokenPurpose } from '../../domain/model/iam.enums.ts';

/** Request body for requesting a password recovery link. */
export interface ForgotPasswordRequest {
  readonly emailAddress: string;
}

/** Request body for defining a new password. */
export interface ResetPasswordRequest {
  readonly token: string;
  readonly purpose: TokenPurpose;
  readonly newPassword: string;
}
