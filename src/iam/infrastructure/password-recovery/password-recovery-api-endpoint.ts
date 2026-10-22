import { BaseApi } from '@/shared/infrastructure/base-api.ts';
import type { ForgotPasswordCommand } from '../../domain/model/forgot-password.command.ts';
import type { DefinePasswordCommand } from '../../domain/model/reset-password.command.ts';
import { toIamErrorFromResponse } from '../iam-error.mapper.ts';
import type {
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from './password-recovery.request.ts';

const forgotPasswordApiUrl =
  `${import.meta.env.VITE_API_BASE_URL}/${import.meta.env.VITE_IAM_FORGOT_PASSWORD_ENDPOINT_PATH}`;
const resetPasswordApiUrl =
  `${import.meta.env.VITE_API_BASE_URL}/${import.meta.env.VITE_IAM_RESET_PASSWORD_ENDPOINT_PATH}`;

/**
 * Endpoint for the IAM password recovery flow.
 * Groups the two backend operations that belong to the same user journey:
 * requesting a recovery link and defining a new password.
 */
export class PasswordRecoveryApiEndpoint {
  /**
   * Requests a password recovery link for the given email address.
   * @param command - The forgot-password command containing the user email.
   * @returns A promise that resolves when the request is processed.
   */
  async requestPasswordReset(command: ForgotPasswordCommand): Promise<void> {
    const request: ForgotPasswordRequest = {
      emailAddress: command.emailAddress,
    };
    const response = await BaseApi.request(
      forgotPasswordApiUrl,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      },
      { authenticated: false },
    );
    if (!response.ok) {
      throw await toIamErrorFromResponse(response);
    }
  }

  /**
   * Sets a new password using the token received by email.
   * @param command - The reset-password command containing the token and new password.
   * @returns A promise that resolves when the password has been updated.
   */
  async resetPassword(command: DefinePasswordCommand): Promise<void> {
    const request: ResetPasswordRequest = {
      token: command.token,
      purpose: command.purpose,
      newPassword: command.newPassword,
    };
    const response = await BaseApi.request(
      resetPasswordApiUrl,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      },
      { authenticated: false },
    );
    if (!response.ok) {
      throw await toIamErrorFromResponse(response, 'invalid_password_token');
    }
  }
}
