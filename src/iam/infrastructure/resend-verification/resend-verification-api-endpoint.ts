import { BaseApi } from '@/shared/infrastructure/base-api.ts';
import type { ResendVerificationCommand } from '../../domain/model/resend-verification.command.ts';
import { toIamErrorFromResponse } from '../iam-error.mapper.ts';
import { ResendVerificationAssembler } from './resend-verification.assembler.ts';

const resendVerificationApiUrl =
  `${import.meta.env.VITE_API_BASE_URL}/${import.meta.env.VITE_IAM_RESEND_VERIFICATION_ENDPOINT_PATH}`;

/**
 * Endpoint for asking a new verification link.
 */
export class ResendVerificationApiEndpoint {
  /**
   * Invalidates the previous link and sends a new one. The backend answers
   * 202 even when the email is not registered.
   * @param command - The resend command.
   */
  async resendVerification(command: ResendVerificationCommand): Promise<void> {
    const response = await BaseApi.request(
      resendVerificationApiUrl,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ResendVerificationAssembler.toRequestFromCommand(command)),
      },
      { authenticated: false },
    );
    if (!response.ok) {
      throw await toIamErrorFromResponse(response);
    }
  }
}
