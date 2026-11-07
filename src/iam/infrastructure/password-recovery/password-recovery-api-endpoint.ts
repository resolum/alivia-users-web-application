import { BaseApi } from '@/shared/infrastructure/base-api.ts';
import type { ChangePasswordCommand } from '../../domain/model/change-password.command.ts';
import type { ForgotPasswordCommand } from '../../domain/model/forgot-password.command.ts';
import { IamError, type IamErrorCode } from '../../domain/model/iam-error.ts';
import type { ResetPasswordCommand } from '../../domain/model/reset-password.command.ts';
import { toIamErrorFromResponse } from '../iam-error.mapper.ts';
import { PasswordRecoveryAssembler } from './password-recovery.assembler.ts';

const FORGOT_PASSWORD_PATH = import.meta.env.VITE_IAM_FORGOT_PASSWORD_ENDPOINT_PATH ?? '';
const RESET_PASSWORD_PATH = import.meta.env.VITE_IAM_RESET_PASSWORD_ENDPOINT_PATH ?? '';
const CHANGE_PASSWORD_PATH = import.meta.env.VITE_IAM_CHANGE_PASSWORD_ENDPOINT_PATH ?? '';

/** The backend reuses the email-verification codes for the reset code; the reset screen names them apart. */
const RESET_CODE_ERRORS: Readonly<Partial<Record<IamErrorCode, IamErrorCode>>> = {
  invalid_verification_code: 'invalid_password_token',
  verification_code_expired: 'password_token_expired',
};

function resolveUrl(path: string): string {
  if (path.trim() === '') {
    throw new IamError({
      code: 'configuration',
      detail: 'The password endpoint is not configured',
    });
  }
  return `${import.meta.env.VITE_API_BASE_URL}/${path}`;
}

function jsonInit(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

/**
 * Endpoint for the IAM password operations: requesting a reset code, setting a
 * new password with that code, and changing the password of a signed-in user.
 */
export class PasswordRecoveryApiEndpoint {
  /**
   * Sends a 6-digit reset code to the email. The backend answers 202 whether
   * the account exists or not.
   */
  async requestPasswordReset(command: ForgotPasswordCommand): Promise<void> {
    const response = await BaseApi.request(
      resolveUrl(FORGOT_PASSWORD_PATH),
      jsonInit('POST', PasswordRecoveryAssembler.toForgotRequestFromCommand(command)),
      { authenticated: false },
    );
    if (!response.ok) {
      throw await toIamErrorFromResponse(response);
    }
  }

  /**
   * Sets a new password with the code received by email. The backend closes
   * the open sessions of the account.
   */
  async resetPassword(command: ResetPasswordCommand): Promise<void> {
    const response = await BaseApi.request(
      resolveUrl(RESET_PASSWORD_PATH),
      jsonInit('POST', PasswordRecoveryAssembler.toResetRequestFromCommand(command)),
      { authenticated: false },
    );
    if (!response.ok) {
      const error = await toIamErrorFromResponse(response, 'invalid_password_token');
      const code = RESET_CODE_ERRORS[error.code];
      throw code === undefined ? error : new IamError({ code, detail: error.detail });
    }
  }

  /**
   * Replaces the password of the signed-in user. A wrong current password
   * comes back as a field error on currentPassword.
   */
  async changePassword(command: ChangePasswordCommand): Promise<void> {
    const response = await BaseApi.request(
      resolveUrl(CHANGE_PASSWORD_PATH),
      jsonInit('PATCH', PasswordRecoveryAssembler.toChangeRequestFromCommand(command)),
      { authenticated: true },
    );
    if (!response.ok) {
      const error = await toIamErrorFromResponse(response, 'validation_failed');
      if (error.fieldErrors.currentPassword === undefined) throw error;
      throw new IamError({
        code: 'current_password_incorrect',
        detail: error.detail,
        fieldErrors: error.fieldErrors,
      });
    }
  }
}
