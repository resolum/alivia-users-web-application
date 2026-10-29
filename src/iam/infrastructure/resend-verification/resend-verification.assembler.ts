import type { ResendVerificationCommand } from '../../domain/model/resend-verification.command.ts';
import type { ResendVerificationRequest } from './resend-verification.request.ts';

export class ResendVerificationAssembler {
  /**
   * Maps a ResendVerificationCommand to a ResendVerificationRequest for the API.
   */
  static toRequestFromCommand(command: ResendVerificationCommand): ResendVerificationRequest {
    return { email: command.emailAddress.trim().toLowerCase() };
  }
}
