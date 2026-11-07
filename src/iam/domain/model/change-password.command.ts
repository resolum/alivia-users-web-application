import type { FieldErrors } from './field-errors.ts';
import { isStrongPassword } from './password-policy.ts';

export type ChangePasswordField = 'currentPassword' | 'newPassword';

/**
 * Command used by a signed-in user to replace the password after confirming
 * the current one. Backend equivalent: ChangePasswordCommand.
 */
export class ChangePasswordCommand {
  private readonly _currentPassword: string;
  private readonly _newPassword: string;

  constructor(params: { currentPassword: string; newPassword: string }) {
    this._currentPassword = params.currentPassword;
    this._newPassword = params.newPassword;
  }

  get currentPassword(): string {
    return this._currentPassword;
  }

  get newPassword(): string {
    return this._newPassword;
  }

  /**
   * Validates the payload and returns the invalid fields, if any.
   */
  validate(): FieldErrors<ChangePasswordField> {
    const errors: FieldErrors<ChangePasswordField> = {};
    if (this._currentPassword === '') errors.currentPassword = 'required';
    if (this._newPassword === '') {
      errors.newPassword = 'required';
    } else if (!isStrongPassword(this._newPassword)) {
      errors.newPassword = 'weak_password';
    }
    return errors;
  }

  /**
   * Hides both passwords so they are never logged.
   */
  toString(): string {
    return 'ChangePasswordCommand(currentPassword=***, newPassword=***)';
  }
}
