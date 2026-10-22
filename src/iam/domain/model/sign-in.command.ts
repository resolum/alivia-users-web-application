import type { FieldErrors } from './field-errors.ts';
import { EmailAddress } from './valueobjects/email-address.ts';

/**
 * Command used to authenticate a user in the IAM bounded context.
 * Backend equivalent: SignInCommand.
 */
export class SignInCommand {
  private readonly _emailAddress: string;
  private readonly _password: string;

  /**
   * Initializes a new SignInCommand.
   * @param params - Command payload for sign-in.
   */
  constructor(params: { emailAddress: string; password: string }) {
    this._emailAddress = params.emailAddress;
    this._password = params.password;
  }

  get emailAddress(): string {
    return this._emailAddress;
  }

  get password(): string {
    return this._password;
  }

  /**
   * Validates the payload and returns the invalid fields, if any.
   */
  validate(): FieldErrors<'emailAddress' | 'password'> {
    const errors: FieldErrors<'emailAddress' | 'password'> = {};
    const emailError = EmailAddress.check(this._emailAddress);
    if (emailError) {
      errors.emailAddress = emailError;
    }
    if (this._password === '') {
      errors.password = 'required';
    }
    return errors;
  }

  /**
   * Hides the password so it is never logged.
   */
  toString(): string {
    return `SignInCommand(emailAddress=${this._emailAddress}, password=***)`;
  }
}
