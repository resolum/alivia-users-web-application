import type { VerifyEmailCommand } from '../../domain/model/verify-email.command.ts';
import type { VerifyEmailRequest } from './verify-email.request.ts';

export class VerifyEmailAssembler {
  /**
   * Maps a VerifyEmailCommand to a VerifyEmailRequest for the API.
   */
  static toRequestFromCommand(command: VerifyEmailCommand): VerifyEmailRequest {
    return { token: command.token };
  }
}
