import type { FieldErrors } from './field-errors.ts';
import type { TokenPurpose } from './iam.enums.ts';
import { isTokenPurpose } from './iam.enums.ts';
import { isStrongPassword } from './password-policy.ts';

/**
 * Command used to define a new password. Backend equivalent: DefinePasswordCommand.
 */
export class DefinePasswordCommand {
  private readonly _token: string;
  private readonly _purpose: TokenPurpose;
  private readonly _newPassword: string;

  /**
   * Initializes a new DefinePasswordCommand.
   * @param params - Password token, token purpose and new password.
   */
  constructor(params: {
    token: string;
    purpose: TokenPurpose;
    newPassword: string;
  }) {
    this._token = params.token;
    this._purpose = params.purpose;
    this._newPassword = params.newPassword;
  }

  get token(): string {
    return this._token;
  }

  get purpose(): TokenPurpose {
    return this._purpose;
  }

  get newPassword(): string {
    return this._newPassword;
  }

  /**
   * Validates the payload and returns the invalid fields, if any.
   */
  validate(): FieldErrors<'token' | 'newPassword'> {
    const errors: FieldErrors<'token' | 'newPassword'> = {};
    if (this._token.trim() === '') {
      errors.token = 'required';
    }
    if (this._newPassword === '') {
      errors.newPassword = 'required';
    } else if (!isStrongPassword(this._newPassword)) {
      errors.newPassword = 'weak_password';
    }
    return errors;
  }

  /**
   * Hides the token and the password so they are never logged.
   */
  toString(): string {
    return `DefinePasswordCommand(token=***, purpose=${this._purpose}, newPassword=***)`;
  }
}

function resolvePurpose(value: string | null | undefined): TokenPurpose {
  if (value !== null && value !== undefined && isTokenPurpose(value)) {
    return value;
  }
  return 'RESET';
}

export function createDefinePasswordCommandFromUrl(params: {
  token: string;
  purpose?: string | null;
  newPassword: string;
}): DefinePasswordCommand {
  return new DefinePasswordCommand({
    token: params.token,
    purpose: resolvePurpose(params.purpose),
    newPassword: params.newPassword,
  });
}
