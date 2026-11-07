import type { ChangePasswordCommand } from '../../domain/model/change-password.command.ts';
import type { ForgotPasswordCommand } from '../../domain/model/forgot-password.command.ts';
import type { ResetPasswordCommand } from '../../domain/model/reset-password.command.ts';
import type {
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from './password-recovery.request.ts';

export class PasswordRecoveryAssembler {
  /**
   * Maps a ForgotPasswordCommand to a ForgotPasswordRequest for the API.
   */
  static toForgotRequestFromCommand(command: ForgotPasswordCommand): ForgotPasswordRequest {
    return { email: command.emailAddress };
  }

  /**
   * Maps a ResetPasswordCommand to a ResetPasswordRequest for the API.
   */
  static toResetRequestFromCommand(command: ResetPasswordCommand): ResetPasswordRequest {
    return {
      email: command.emailAddress,
      code: command.code,
      password: command.newPassword,
    };
  }

  /**
   * Maps a ChangePasswordCommand to a ChangePasswordRequest for the API.
   */
  static toChangeRequestFromCommand(command: ChangePasswordCommand): ChangePasswordRequest {
    return {
      currentPassword: command.currentPassword,
      newPassword: command.newPassword,
    };
  }
}
