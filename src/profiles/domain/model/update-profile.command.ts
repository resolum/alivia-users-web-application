import { PhoneNumber } from '@/iam/index.ts';
import type { ProfileFieldErrors } from './profile-error.ts';

export type UpdateProfileField = 'firstName' | 'lastName' | 'phoneNumber';

const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 75;

function checkName(value: string) {
  if (value === '') return 'required';
  if (value.length < NAME_MIN_LENGTH) return 'too_short';
  if (value.length > NAME_MAX_LENGTH) return 'too_long';
  return null;
}

/** Updates the editable personal data of the caller's own profile. */
export class UpdateProfileCommand {
  readonly firstName: string;
  readonly lastName: string;
  private readonly rawPhoneNumber: string;

  constructor(params: { firstName: string; lastName: string; phoneNumber: string }) {
    this.firstName = params.firstName.trim();
    this.lastName = params.lastName.trim();
    this.rawPhoneNumber = params.phoneNumber.trim();
  }

  /** Phone number as E.164 digits, ready for the backend. */
  get phoneNumber(): string {
    return PhoneNumber.toE164Digits(this.rawPhoneNumber) ?? this.rawPhoneNumber;
  }

  validate(): ProfileFieldErrors<UpdateProfileField> {
    const errors: ProfileFieldErrors<UpdateProfileField> = {};

    const firstNameError = checkName(this.firstName);
    if (firstNameError) errors.firstName = firstNameError;

    const lastNameError = checkName(this.lastName);
    if (lastNameError) errors.lastName = lastNameError;

    const phoneError = PhoneNumber.check(this.rawPhoneNumber);
    if (phoneError) errors.phoneNumber = phoneError === 'required' ? 'required' : 'invalid_phone';

    return errors;
  }
}
