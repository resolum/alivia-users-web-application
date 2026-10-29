import type { FieldErrorCode } from '../field-errors.ts';

const PERU_COUNTRY_CODE = '51';
const PERU_MOBILE_LENGTH = 9;

function stripSeparators(value: string): string {
  let result = '';
  for (const character of value) {
    if (character !== ' ' && character !== '-' && character !== '+') {
      result += character;
    }
  }
  return result;
}

function isDigits(value: string): boolean {
  if (value.length === 0) return false;
  for (const character of value) {
    if (character < '0' || character > '9') return false;
  }
  return true;
}

/**
 * Phone number value object. The backend stores E.164 digits without the plus
 * sign (51987654321), so a 9-digit Peruvian mobile gets the 51 prefix.
 */
export class PhoneNumber {
  /**
   * Normalizes a raw phone number to E.164 digits.
   * @param value - Raw phone number as typed by the user.
   * @returns The digits, or null when the value cannot be a phone number.
   */
  static toE164Digits(value: string): string | null {
    const digits = stripSeparators(value.trim());
    if (!isDigits(digits) || digits.startsWith('0')) return null;

    const normalized =
      digits.length === PERU_MOBILE_LENGTH && digits.startsWith('9')
        ? `${PERU_COUNTRY_CODE}${digits}`
        : digits;
    return normalized.length >= 10 && normalized.length <= 15 ? normalized : null;
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
