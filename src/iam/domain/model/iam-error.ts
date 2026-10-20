export const IAM_ERROR_CODES = [
  'invalid_credentials',
  'email_not_verified',
  'account_pending',
  'account_blocked',
  'account_deactivated',
  'email_already_registered',
  'email_already_verified',
  'invalid_verification_code',
  'verification_code_expired',
  'invalid_password_token',
  'password_token_expired',
  'role_not_allowed',
  'rate_limited',
  'network',
  'configuration',
  'unknown',
] as const;
export type IamErrorCode = (typeof IAM_ERROR_CODES)[number];

/**
 * Error raised by the IAM bounded context. It never contains UI texts.
 */
export class IamError extends Error {
  private readonly _code: IamErrorCode;
  private readonly _detail?: string;

  /**
   * Initializes a new IamError.
   * @param params - Error code, optional internal detail and optional cause.
   */
  constructor(params: {
    code: IamErrorCode;
    detail?: string;
    cause?: unknown;
  }) {
    super(params.code, { cause: params.cause });
    this.name = 'IamError';
    this._code = params.code;
    this._detail = params.detail;
  }

  get code(): IamErrorCode {
    return this._code;
  }

  get detail(): string | undefined {
    return this._detail;
  }
}
