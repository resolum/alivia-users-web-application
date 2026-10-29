import type { FieldErrors } from './field-errors.ts';
import { EmailAddress } from './valueobjects/email-address.ts';

/**
 * Command used to request a password reset in the IAM bounded context.
 * Backend equivalent: RequestPasswordResetCommand.
 */
export class ForgotPasswordCommand {
  private readonly _emailAddress: string;

  /**
   * Initializes a new ForgotPasswordCommand.
   * @param params - Command payload for password recovery.
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
