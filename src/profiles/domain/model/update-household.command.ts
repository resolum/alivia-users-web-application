export type HouseholdField = 'alias' | 'phone' | 'email';
export type HouseholdFieldError = 'required' | 'too_long' | 'invalid_phone' | 'invalid_email';

export const ALIAS_MAX = 50;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Peruvian mobile: 9 digits starting with 9. */
const LOCAL_PHONE = /^9\d{8}$/;

/** Contact data of the home. The address has its own flow because it affects technical coverage. */
export class UpdateHouseholdCommand {
  readonly alias: string;
  /** Digits after +51, spaces allowed while typing. */
  readonly localPhone: string;
  readonly email: string;

  constructor(alias: string, localPhone: string, email: string) {
    this.alias = alias.trim();
    this.localPhone = localPhone.replace(/\s+/g, '');
    this.email = email.trim().toLowerCase();
  }

  get internationalPhone(): string {
    const digits = this.localPhone;
    return `+51 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }

  validate(): Partial<Record<HouseholdField, HouseholdFieldError>> {
    const errors: Partial<Record<HouseholdField, HouseholdFieldError>> = {};
    if (this.alias === '') errors.alias = 'required';
    else if (this.alias.length > ALIAS_MAX) errors.alias = 'too_long';
    if (this.localPhone === '') errors.phone = 'required';
    else if (!LOCAL_PHONE.test(this.localPhone)) errors.phone = 'invalid_phone';
    if (this.email === '') errors.email = 'required';
    else if (!EMAIL_PATTERN.test(this.email)) errors.email = 'invalid_email';
    return errors;
  }
}

/** "+51 984 123 456" → "984 123 456" for the edit field. */
export function toLocalPhone(phone: string): string {
  return phone.replace(/^\+51\s*/, '');
}
