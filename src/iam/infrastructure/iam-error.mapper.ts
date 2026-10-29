import type { FieldErrorCode } from '../domain/model/field-errors.ts';
import {
  IAM_ERROR_CODES,
  IamError,
  type IamErrorCode,
  type IamFieldErrors,
} from '../domain/model/iam-error.ts';

/** Backend codes that name the same situation as an internal code. */
const BACKEND_CODE_ALIASES: Readonly<Record<string, IamErrorCode>> = {
  verification_token_invalid: 'invalid_verification_code',
  verification_token_expired: 'verification_code_expired',
  account_already_verified: 'email_already_verified',
  verification_resend_too_soon: 'rate_limited',
  registration_unavailable: 'service_unavailable',
  account_not_active: 'account_pending',
  dni_already_registered: 'validation_failed',
};

/** Backend field names that differ from the frontend ones. */
const BACKEND_FIELD_ALIASES: Readonly<Record<string, string>> = {
  email: 'emailAddress',
};

const BACKEND_FIELD_CODES: Readonly<Record<string, FieldErrorCode>> = {
  required: 'required',
  invalid_email: 'invalid_email',
  password_weak: 'weak_password',
  terms_not_accepted: 'terms_not_accepted',
  too_long: 'too_long',
  invalid_phone_number: 'invalid_phone',
  email_already_registered: 'already_registered',
  dni_already_registered: 'already_registered',
};

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Normalizes a raw value to a known IAM error code.
 * @param value - Raw code from the backend or mock configuration.
 */
export function toIamErrorCode(value: unknown): IamErrorCode | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  return (
    IAM_ERROR_CODES.find((code) => code === normalized) ??
    BACKEND_CODE_ALIASES[normalized] ??
    null
  );
}

function readCode(body: unknown): IamErrorCode | null {
  if (!isRecord(body)) return null;

  const candidates = [body.code, body.error, body.errorCode, body.message];
  for (const candidate of candidates) {
    const code = toIamErrorCode(candidate);
    if (code !== null) return code;
  }
  return null;
}

function readDetail(body: unknown): string | undefined {
  if (typeof body === 'string') {
    const text = body.trim();
    return text === '' ? undefined : text;
  }
  if (!isRecord(body)) return undefined;

  const detail = body.detail ?? body.message;
  if (typeof detail !== 'string') return undefined;
  const text = detail.trim();
  return text === '' ? undefined : text;
}

/** Reads the ProblemDetail `errors` property: `[{ field, code }]`. */
function readFieldErrors(body: unknown): IamFieldErrors {
  if (!isRecord(body) || !Array.isArray(body.errors)) return {};

  const items: readonly unknown[] = body.errors;
  const errors: Record<string, FieldErrorCode> = {};
  for (const item of items) {
    if (!isRecord(item)) continue;
    const { field, code } = item;
    if (typeof field !== 'string' || typeof code !== 'string') continue;
    const name = BACKEND_FIELD_ALIASES[field] ?? field;
    errors[name] = BACKEND_FIELD_CODES[code] ?? 'invalid';
  }
  return errors;
}

function readRetryAfter(response: Response, body: unknown): number | null {
  const fromBody = isRecord(body) ? body.retryAfterSeconds : undefined;
  const raw = typeof fromBody === 'number' ? fromBody : Number(response.headers.get('Retry-After'));
  return Number.isFinite(raw) && raw > 0 ? Math.ceil(raw) : null;
}

async function readBody(response: Response): Promise<unknown> {
  try {
    const text = await response.text();
    if (text.trim() === '') return null;
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  } catch {
    return null;
  }
}

function fallbackForStatus(
  status: number,
  fallback: IamErrorCode,
): IamErrorCode {
  if (status === 429) return 'rate_limited';
  if (status === 503) return 'service_unavailable';
  if (status === 401 || status === 400 || status === 409) return fallback;
  return 'unknown';
}

/**
 * Maps an HTTP error response to an IamError.
 * @param response - Failed HTTP response.
 * @param fallback - Code used for a 400, 401 or 409 response without a
 * recognizable code.
 */
export async function toIamErrorFromResponse(
  response: Response,
  fallback: IamErrorCode = 'unknown',
): Promise<IamError> {
  const body = await readBody(response);
  const code =
    response.status === 429
      ? 'rate_limited'
      : (readCode(body) ?? fallbackForStatus(response.status, fallback));
  const detail = readDetail(body) ?? `HTTP ${response.status}`;
  return new IamError({
    code,
    detail,
    fieldErrors: readFieldErrors(body),
    retryAfterSeconds: readRetryAfter(response, body),
  });
}
