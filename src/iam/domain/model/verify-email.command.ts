import type { FieldErrors } from './field-errors.ts';
import { EmailAddress } from './valueobjects/email-address.ts';

export class VerifyEmailCommand {
  private readonly _emailAddress: string;
  private readonly _code: string;

  /**
   * Initializes a new VerifyEmailCommand.
   * @param params - Command payload for email verification.
   */
  constructor(params: { emailAddress: string; code: string }) {
    this._emailAddress = params.emailAddress;
    this._code = params.code;
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
  validate(): FieldErrors<'emailAddress' | 'code'> {
    const errors: FieldErrors<'emailAddress' | 'code'> = {};
    const emailError = EmailAddress.check(this._emailAddress);
    if (emailError) {
      errors.emailAddress = emailError;
    }
    if (this._code.trim() === '') {
      errors.code = 'required';
    }
    return errors;
  }
}
