import type { ForgotPasswordCommand } from '../../domain/model/forgot-password.command.ts';
import type { DefinePasswordCommand } from '../../domain/model/reset-password.command.ts';
import type {
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from './password-recovery.request.ts';

export class PasswordRecoveryAssembler {
  /**
   * Maps a ForgotPasswordCommand to a ForgotPasswordRequest for the API.
   */
  static toForgotRequestFromCommand(command: ForgotPasswordCommand): ForgotPasswordRequest {
    return { emailAddress: command.emailAddress };
  }

  /**
   * Maps a DefinePasswordCommand to a ResetPasswordRequest for the API.
   */
  static toResetRequestFromCommand(command: DefinePasswordCommand): ResetPasswordRequest {
    return {
      token: command.token,
      purpose: command.purpose,
      newPassword: command.newPassword,
    };
  }
}
