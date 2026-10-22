import {
  IAM_ERROR_CODES,
  IamError,
  type IamErrorCode,
} from '../domain/model/iam-error.ts';

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
  return IAM_ERROR_CODES.find((code) => code === normalized) ?? null;
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
  if (status === 401) return fallback;
  return 'unknown';
}

/**
 * Maps an HTTP error response to an IamError.
 * @param response - Failed HTTP response.
 * @param fallback - Code used for a 401 response without a recognizable code.
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
  return new IamError({ code, detail });
}
