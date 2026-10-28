import { BaseApi } from '@/shared/infrastructure/base-api.ts';
import type { Account } from '../../domain/model/account.entity.ts';
import type { VerifyEmailCommand } from '../../domain/model/verify-email.command.ts';
import { toIamErrorFromResponse } from '../iam-error.mapper.ts';
import { VerifyEmailAssembler } from './verify-email.assembler.ts';
import type { VerifyEmailResponse } from './verify-email.response.ts';

const verifyEmailApiUrl =
  `${import.meta.env.VITE_API_BASE_URL}/${import.meta.env.VITE_IAM_VERIFY_EMAIL_ENDPOINT_PATH}`;

/**
 * Endpoint for verifying an email address with the token of the link.
 */
export class VerifyEmailApiEndpoint {
  /**
   * Verifies the email address bound to the token. Each token works once.
   * @param command - The verify-email command.
   * @returns A promise resolving to the verified account.
   */
  async verifyEmail(command: VerifyEmailCommand): Promise<Account> {
    const response = await BaseApi.request(
      verifyEmailApiUrl,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(VerifyEmailAssembler.toRequestFromCommand(command)),
      },
      { authenticated: false },
    );
    if (!response.ok) {
      throw await toIamErrorFromResponse(response, 'invalid_verification_code');
    }

    const data: VerifyEmailResponse = await response.json();
    return VerifyEmailAssembler.toEntityFromResponse(data);
  }
}
