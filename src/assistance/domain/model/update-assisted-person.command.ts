export type AssistedPersonField = 'firstName' | 'lastName' | 'birthDate' | 'kinship' | 'phone';
export type AssistedPersonFieldError = 'required' | 'too_short' | 'invalid_date' | 'invalid_phone';

/** Peruvian mobile: 9 digits starting with 9. */
const LOCAL_PHONE = /^9\d{8}$/;

export interface AssistedPersonValues {
  readonly firstName: string;
  readonly lastName: string;
  readonly birthDate: string;
  readonly kinship: string;
  /** Digits after +51; empty when the person has no phone of their own. */
  readonly localPhone: string;
}

/** Editable data of the assisted person. The document stays with identity checks. */
export class UpdateAssistedPersonCommand {
  readonly values: AssistedPersonValues;

  constructor(values: AssistedPersonValues) {
    this.values = {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      birthDate: values.birthDate,
      kinship: values.kinship.trim(),
      localPhone: values.localPhone.replace(/\s+/g, ''),
    };
  }

  get phone(): string | null {
    const digits = this.values.localPhone;
    return digits === '' ? null : `+51 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }

  validate(now: Date = new Date()): Partial<Record<AssistedPersonField, AssistedPersonFieldError>> {
    const { firstName, lastName, birthDate, kinship, localPhone } = this.values;
    const errors: Partial<Record<AssistedPersonField, AssistedPersonFieldError>> = {};
    if (firstName === '') errors.firstName = 'required';
    else if (firstName.length < 2) errors.firstName = 'too_short';
    if (lastName === '') errors.lastName = 'required';
    else if (lastName.length < 2) errors.lastName = 'too_short';
    if (birthDate === '') errors.birthDate = 'required';
    else if (Number.isNaN(Date.parse(birthDate)) || new Date(`${birthDate}T00:00:00`) > now || birthDate < '1900-01-01') {
      errors.birthDate = 'invalid_date';
    }
    if (kinship === '') errors.kinship = 'required';
    if (localPhone !== '' && !LOCAL_PHONE.test(localPhone)) errors.phone = 'invalid_phone';
    return errors;
  }
}
