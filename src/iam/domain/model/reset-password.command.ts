import type { FieldErrors } from './field-errors.ts';
import { isStrongPassword } from './password-policy.ts';
import { EmailAddress } from './valueobjects/email-address.ts';

export type ResetPasswordField = 'emailAddress' | 'code' | 'newPassword';

const RESET_CODE = /^\d{6}$/;

/**
 * Command used to set a new password with the 6-digit code sent by email.
 * Backend equivalent: ResetPasswordCommand.
 */
export class ResetPasswordCommand {
  private readonly _emailAddress: string;
  private readonly _code: string;
  private readonly _newPassword: string;

  /**
   * Initializes a new ResetPasswordCommand.
   * @param params - Account email, code received by email and new password.
   */
  constructor(params: { emailAddress: string; code: string; newPassword: string }) {
    this._emailAddress = params.emailAddress.trim();
    this._code = params.code.trim();
    this._newPassword = params.newPassword;
  }

  get emailAddress(): string {
    return this._emailAddress;
  }

  get code(): string {
    return this._code;
  }

  get newPassword(): string {
    return this._newPassword;
  }

  /**
   * Validates the payload and returns the invalid fields, if any.
   */
  validate(): FieldErrors<ResetPasswordField> {
    const errors: FieldErrors<ResetPasswordField> = {};
    const emailError = EmailAddress.check(this._emailAddress);
    if (emailError) errors.emailAddress = emailError;
    if (this._code === '') {
      errors.code = 'required';
    } else if (!RESET_CODE.test(this._code)) {
      errors.code = 'invalid';
    }
    if (this._newPassword === '') {
      errors.newPassword = 'required';
    } else if (!isStrongPassword(this._newPassword)) {
      errors.newPassword = 'weak_password';
    }
    return errors;
  }

  /**
   * Hides the code and the password so they are never logged.
   */
  toString(): string {
    return 'ResetPasswordCommand(code=***, newPassword=***)';
  }
}
