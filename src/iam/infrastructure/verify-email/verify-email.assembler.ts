import { Account } from '../../domain/model/account.entity.ts';
import type { VerifyEmailCommand } from '../../domain/model/verify-email.command.ts';
import type { VerifyEmailRequest } from './verify-email.request.ts';
import type { VerifyEmailResponse } from './verify-email.response.ts';

export class VerifyEmailAssembler {
  /**
   * Maps a VerifyEmailCommand to a VerifyEmailRequest for the API.
   */
  static toRequestFromCommand(command: VerifyEmailCommand): VerifyEmailRequest {
    return { token: command.token };
  }

  /**
   * Maps a VerifyEmailResponse to an Account domain entity.
   */
  static toEntityFromResponse(response: VerifyEmailResponse): Account {
    return new Account({ accountId: response.accountId, status: response.status });
  }
}
