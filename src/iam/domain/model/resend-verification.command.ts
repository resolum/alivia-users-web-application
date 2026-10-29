import type { FieldErrors } from './field-errors.ts';
import { EmailAddress } from './valueobjects/email-address.ts';

/**
 * Command used to resend the email verification link.
 * Backend equivalent: ResendVerificationCommand. The backend does not fail
 * when the email address does not exist.
 */
export class ResendVerificationCommand {
  private readonly _emailAddress: string;

  /**
   * Initializes a new ResendVerificationCommand.
   * @param params - Command payload for resending the verification link.
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
