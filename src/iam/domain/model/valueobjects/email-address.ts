import type { FieldErrorCode } from '../field-errors.ts';

function containsWhitespace(value: string): boolean {
  for (const character of value) {
    if (character.trim().length === 0) return true;
  }
  return false;
}

function hasValidFormat(value: string): boolean {
  if (value.length === 0 || containsWhitespace(value)) return false;

  const atIndex = value.indexOf('@');
  if (atIndex <= 0 || atIndex !== value.lastIndexOf('@')) return false;

  const domain = value.slice(atIndex + 1);
  const dotIndex = domain.indexOf('.');
  if (dotIndex <= 0 || dotIndex === domain.length - 1) return false;

  return true;
}

/**
 * Email address value object. Backend equivalent: EmailAddress.
 * The format is validated with string operations, never with regular expressions.
 */
export class EmailAddress {
  private readonly _value: string;

  /**
   * Initializes a validated, normalized email address.
   * @param value - Normalized email address.
   */
  private constructor(value: string) {
    this._value = value;
  }

  /**
   * Creates an email address from a raw value.
   * @param value - Raw email address.
   * @returns A normalized instance, or null when the format is invalid.
   */
  static of(value: string): EmailAddress | null {
    const normalized = value.trim().toLowerCase();
    return hasValidFormat(normalized) ? new EmailAddress(normalized) : null;
  }

  /**
   * Validates a raw email address and returns its field error, if any.
   * @param value - Raw email address.
   */
  static check(value: string): FieldErrorCode | null {
    const normalized = value.trim();
    if (normalized.length === 0) return 'required';
    return hasValidFormat(normalized) ? null : 'invalid_email';
  }

  get value(): string {
    return this._value;
  }

  /**
   * Compares this address with another one.
   * @param other - Address to compare with.
   */
  equals(other: EmailAddress): boolean {
    return this._value === other._value;
  }

  /**
   * Returns the normalized address.
   */
  toString(): string {
    return this._value;
  }
}
