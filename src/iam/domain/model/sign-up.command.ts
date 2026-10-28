import type { FieldErrors } from './field-errors.ts';
import { isStrongPassword } from './password-policy.ts';
import { EmailAddress } from './valueobjects/email-address.ts';
import { PhoneNumber } from './valueobjects/phone-number.ts';

export type SignUpField =
  | 'firstName'
  | 'lastName'
  | 'emailAddress'
  | 'phoneNumber'
  | 'dni'
  | 'birthDate'
  | 'password'
  | 'acceptedTerms';

const NAME_MAX_LENGTH = 75;
const DNI_LENGTH = 8;

function isDni(value: string): boolean {
  if (value.length !== DNI_LENGTH) return false;
  for (const character of value) {
    if (character < '0' || character > '9') return false;
  }
  return true;
}

/** True when the value is an ISO date (yyyy-mm-dd) that is not in the future. */
function isPastIsoDate(value: string): boolean {
  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime()) && date.getTime() <= Date.now();
}

/**
 * Command used to register the responsible client of a household.
 * Backend equivalent: SignUpCommand with the CAREGIVER access role, which
 * requires the DNI and the birth date for the person profile.
 */
export class SignUpCommand {
  private readonly _firstName: string;
  private readonly _lastName: string;
  private readonly _emailAddress: string;
  private readonly _phoneNumber: string;
  private readonly _dni: string;
  private readonly _birthDate: string;
  private readonly _password: string;
  private readonly _acceptedTerms: boolean;

  /**
   * Initializes a new SignUpCommand.
   * @param params - Registration data of the responsible client.
   */
  constructor(params: {
    firstName: string;
    lastName: string;
    emailAddress: string;
    phoneNumber: string;
    dni: string;
    birthDate: string;
    password: string;
    acceptedTerms: boolean;
  }) {
    this._firstName = params.firstName.trim();
    this._lastName = params.lastName.trim();
    this._emailAddress = params.emailAddress.trim();
    this._phoneNumber = params.phoneNumber.trim();
    this._dni = params.dni.trim();
    this._birthDate = params.birthDate;
    this._password = params.password;
    this._acceptedTerms = params.acceptedTerms;
  }

  get firstName(): string {
    return this._firstName;
  }

  get lastName(): string {
    return this._lastName;
  }

  get emailAddress(): string {
    return this._emailAddress;
  }

  /** Phone number as E.164 digits, ready for the backend. */
  get phoneNumber(): string {
    return PhoneNumber.toE164Digits(this._phoneNumber) ?? this._phoneNumber;
  }

  get dni(): string {
    return this._dni;
  }

  get birthDate(): string {
    return this._birthDate;
  }

  get password(): string {
    return this._password;
  }

  get acceptedTerms(): boolean {
    return this._acceptedTerms;
  }

  /**
   * Validates the payload and returns the invalid fields, if any.
   */
  validate(): FieldErrors<SignUpField> {
    const errors: FieldErrors<SignUpField> = {};

    if (this._firstName === '') errors.firstName = 'required';
    else if (this._firstName.length > NAME_MAX_LENGTH) errors.firstName = 'too_long';

    if (this._lastName === '') errors.lastName = 'required';
    else if (this._lastName.length > NAME_MAX_LENGTH) errors.lastName = 'too_long';

    const emailError = EmailAddress.check(this._emailAddress);
    if (emailError) errors.emailAddress = emailError;

    const phoneError = PhoneNumber.check(this._phoneNumber);
    if (phoneError) errors.phoneNumber = phoneError;

    if (this._dni === '') errors.dni = 'required';
    else if (!isDni(this._dni)) errors.dni = 'invalid_dni';

    if (this._birthDate === '') errors.birthDate = 'required';
    else if (!isPastIsoDate(this._birthDate)) errors.birthDate = 'invalid_date';

    if (this._password === '') errors.password = 'required';
    else if (!isStrongPassword(this._password)) errors.password = 'weak_password';

    if (!this._acceptedTerms) errors.acceptedTerms = 'terms_not_accepted';

    return errors;
  }

  /**
   * Hides the password and the DNI so they are never logged.
   */
  toString(): string {
    return `SignUpCommand(emailAddress=${this._emailAddress}, dni=***, password=***)`;
  }
}
