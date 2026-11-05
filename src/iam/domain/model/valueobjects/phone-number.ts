import type { FieldErrorCode } from '../field-errors.ts';

const PERU_COUNTRY_CODE = '51';
/** Digits of a Peruvian mobile without the country code. */
export const PERU_MOBILE_LENGTH = 9;

function onlyDigits(value: string): string {
  let result = '';
  for (const character of value) {
    if (character >= '0' && character <= '9') result += character;
  }
  return result;
}

/**
 * Phone number value object for a Peruvian mobile. The form takes the 9 local
 * digits after a fixed +51; the backend stores E.164 digits without the plus
 * sign (51987654321).
 */
export class PhoneNumber {
  /**
   * Keeps what the user typed or pasted as at most 9 local digits. A pasted
   * number with its +51 code ("+51 987 654 321") loses the code first.
   * @param value - Raw input.
   */
  static toLocalDigits(value: string): string {
    let digits = onlyDigits(value);
    if (digits.length > PERU_MOBILE_LENGTH && digits.startsWith(PERU_COUNTRY_CODE)) {
      digits = digits.slice(PERU_COUNTRY_CODE.length);
    }
    return digits.slice(0, PERU_MOBILE_LENGTH);
  }

  /**
   * Normalizes a Peruvian mobile to E.164 digits.
   * @param value - The 9 local digits, with or without spaces or the +51 code.
   * @returns 51 followed by the 9 digits, or null when it is not a Peruvian mobile.
   */
  static toE164Digits(value: string): string | null {
    let digits = onlyDigits(value);
    if (digits.length === PERU_MOBILE_LENGTH + PERU_COUNTRY_CODE.length && digits.startsWith(PERU_COUNTRY_CODE)) {
      digits = digits.slice(PERU_COUNTRY_CODE.length);
    }
    if (digits.length !== PERU_MOBILE_LENGTH || !digits.startsWith('9')) return null;
    return `${PERU_COUNTRY_CODE}${digits}`;
  }

  /**
   * Validates a raw phone number and returns its field error, if any.
   * @param value - Raw phone number.
   */
  static check(value: string): FieldErrorCode | null {
    if (value.trim().length === 0) return 'required';
    return PhoneNumber.toE164Digits(value) === null ? 'invalid_phone' : null;
  }
}
