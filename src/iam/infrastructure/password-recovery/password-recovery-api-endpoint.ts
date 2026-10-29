import { BaseApi } from '@/shared/infrastructure/base-api.ts';
import type { ForgotPasswordCommand } from '../../domain/model/forgot-password.command.ts';
import { IamError } from '../../domain/model/iam-error.ts';
import type { DefinePasswordCommand } from '../../domain/model/reset-password.command.ts';
import { toIamErrorFromResponse } from '../iam-error.mapper.ts';
import { PasswordRecoveryAssembler } from './password-recovery.assembler.ts';

const FORGOT_PASSWORD_PATH = import.meta.env.VITE_IAM_FORGOT_PASSWORD_ENDPOINT_PATH ?? '';
const RESET_PASSWORD_PATH = import.meta.env.VITE_IAM_RESET_PASSWORD_ENDPOINT_PATH ?? '';

/** PENDING(contract): the backend has no password recovery endpoints yet. */
function resolveUrl(path: string): string {
  if (path.trim() === '') {
    throw new IamError({
      code: 'configuration',
      detail: 'The password recovery endpoint is not configured',
    });
  }
  return `${import.meta.env.VITE_API_BASE_URL}/${path}`;
}

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
    const response = await BaseApi.request(
      resolveUrl(FORGOT_PASSWORD_PATH),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(PasswordRecoveryAssembler.toForgotRequestFromCommand(command)),
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
    const response = await BaseApi.request(
      resolveUrl(RESET_PASSWORD_PATH),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(PasswordRecoveryAssembler.toResetRequestFromCommand(command)),
      },
      { authenticated: false },
    );
    if (!response.ok) {
      throw await toIamErrorFromResponse(response, 'invalid_password_token');
    }
  }
}
