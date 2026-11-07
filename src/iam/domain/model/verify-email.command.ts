import type { FieldErrors } from './field-errors.ts';
import { EmailAddress } from './valueobjects/email-address.ts';

export type VerifyEmailField = 'emailAddress' | 'code';

const VERIFICATION_CODE = /^\d{6}$/;

/**
 * Command used to verify an email address with the 6-digit code sent to it.
 * Backend equivalent: VerifyEmailCommand. Each code works only once.
 */
export class VerifyEmailCommand {
  private readonly _emailAddress: string;
  private readonly _code: string;

  /**
   * Initializes a new VerifyEmailCommand.
   * @param params - Registered email and the code received by email.
   */
  constructor(params: { emailAddress: string; code: string }) {
    this._emailAddress = params.emailAddress.trim();
    this._code = params.code.trim();
  }

  get emailAddress(): string {
    return this._emailAddress;
  }

  get code(): string {
    return this._code;
  }

  /**
   * Validates the payload and returns the invalid fields, if any.
   */
  validate(): FieldErrors<VerifyEmailField> {
    const errors: FieldErrors<VerifyEmailField> = {};
    const emailError = EmailAddress.check(this._emailAddress);
    if (emailError) errors.emailAddress = emailError;
    if (this._code === '') {
      errors.code = 'required';
    } else if (!VERIFICATION_CODE.test(this._code)) {
      errors.code = 'invalid';
    }
    return errors;
  }

  /**
   * Hides the code so it is never logged.
   */
  toString(): string {
    return 'VerifyEmailCommand(code=***)';
  }
}
