import type { FieldErrorCode } from './field-errors.ts';

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
  'validation_failed',
  'service_unavailable',
  'network',
  'configuration',
  'unknown',
] as const;
export type IamErrorCode = (typeof IAM_ERROR_CODES)[number];

/** Field errors reported by the backend, keyed by the frontend field name. */
export type IamFieldErrors = Readonly<Record<string, FieldErrorCode>>;

/**
 * Error raised by the IAM bounded context. It never contains UI texts.
 */
export class IamError extends Error {
  private readonly _code: IamErrorCode;
  private readonly _detail?: string;
  private readonly _fieldErrors: IamFieldErrors;
  private readonly _retryAfterSeconds: number | null;

  /**
   * Initializes a new IamError.
   * @param params - Error code, optional internal detail, field errors,
   * seconds to wait before retrying and optional cause.
   */
  constructor(params: {
    code: IamErrorCode;
    detail?: string;
    fieldErrors?: IamFieldErrors;
    retryAfterSeconds?: number | null;
    cause?: unknown;
  }) {
    super(params.code, { cause: params.cause });
    this.name = 'IamError';
    this._code = params.code;
    this._detail = params.detail;
    this._fieldErrors = params.fieldErrors ?? {};
    this._retryAfterSeconds = params.retryAfterSeconds ?? null;
  }

  get code(): IamErrorCode {
    return this._code;
  }

  get detail(): string | undefined {
    return this._detail;
  }

  get fieldErrors(): IamFieldErrors {
    return this._fieldErrors;
  }

  get retryAfterSeconds(): number | null {
    return this._retryAfterSeconds;
  }
}
