import type { FieldErrors } from './field-errors.ts';

/**
 * Command used to verify an email address with the token of the link sent by
 * email. Backend equivalent: VerifyEmailCommand. Each token works only once.
 */
export class VerifyEmailCommand {
  private readonly _token: string;

  /**
   * Initializes a new VerifyEmailCommand.
   * @param params - Verification token read from the link.
   */
  constructor(params: { token: string }) {
    this._token = params.token.trim();
  }

  get token(): string {
    return this._token;
  }

  /**
   * Validates the payload and returns the invalid fields, if any.
   */
  validate(): FieldErrors<'token'> {
    return this._token === '' ? { token: 'required' } : {};
  }

  /**
   * Hides the token so it is never logged.
   */
  toString(): string {
    return 'VerifyEmailCommand(token=***)';
  }
}
