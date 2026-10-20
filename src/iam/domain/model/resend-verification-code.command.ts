import type { FieldErrors } from './field-errors.ts';
import { EmailAddress } from './valueobjects/email-address.ts';

/**
 * Command used to resend an email verification code.
 * Backend equivalent: ResendVerificationCodeCommand. The backend does not fail
 * when the email address does not exist.
 */
export class ResendVerificationCodeCommand {
  private readonly _emailAddress: string;

  /**
   * Initializes a new ResendVerificationCodeCommand.
   * @param params - Command payload for resending the verification code.
   */
  constructor(params: { emailAddress: string }) {
    this._emailAddress = params.emailAddress;
  }

  get emailAddress(): string {
    return this._emailAddress;
  }

  /**
   * Validates the payload and returns the invalid fields, if any.
   */
  validate(): FieldErrors<'emailAddress'> {
    const error = EmailAddress.check(this._emailAddress);
    return error ? { emailAddress: error } : {};
  }
}
