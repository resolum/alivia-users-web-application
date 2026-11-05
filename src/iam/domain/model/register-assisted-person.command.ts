import type { FieldErrors } from './field-errors.ts';
import { PhoneNumber } from './valueobjects/phone-number.ts';

/** Identity documents accepted for the assisted person. */
export const ASSISTED_DOCUMENT_TYPES = ['DNI', 'CE', 'PASSPORT'] as const;
export type AssistedDocumentType = (typeof ASSISTED_DOCUMENT_TYPES)[number];

/** How the assisted person is related to the principal caregiver. */
export const KINSHIPS = ['PARENT', 'GRANDPARENT', 'AUNT_UNCLE', 'SPOUSE', 'SIBLING', 'OTHER'] as const;
export type Kinship = (typeof KINSHIPS)[number];

/** General mobility of the assisted person, used to adapt the devices. */
export const MOBILITY_LEVELS = ['VERY_LIMITED', 'NO_LIMB_MOBILITY', 'PARTIAL'] as const;
export type MobilityLevel = (typeof MOBILITY_LEVELS)[number];

export type AssistedPersonRegistrationField =
  | 'firstName'
  | 'lastName'
  | 'birthDate'
  | 'documentNumber'
  | 'kinship'
  | 'phoneNumber'
  | 'mobilityLevel'
  | 'emergencyContactName'
  | 'emergencyContactPhone'
  | 'consent';

export interface AssistedPersonRegistrationValues {
  readonly firstName: string;
  readonly lastName: string;
  /** ISO date (yyyy-mm-dd). */
  readonly birthDate: string;
  readonly documentType: AssistedDocumentType;
  /** Optional; empty when the family does not register a document. */
  readonly documentNumber: string;
  /** Empty until the client picks one. */
  readonly kinship: Kinship | '';
  /** Optional 9 local digits after +51. */
  readonly phoneNumber: string;
  readonly mobilityLevel: MobilityLevel | '';
  /** Optional secondary emergency contact. */
  readonly emergencyContactName: string;
  readonly emergencyContactPhone: string;
  /** The client confirms the person or their legal representative authorized the data. */
  readonly consent: boolean;
}

const NAME_MAX_LENGTH = 75;
const CONTACT_NAME_MAX_LENGTH = 120;
const OLDEST_BIRTH_DATE = '1900-01-01';
const DNI = /^\d{8}$/;
/** Foreigner ID card (carné de extranjería). */
const CE = /^[A-Za-z0-9]{9,12}$/;
const PASSPORT = /^[A-Za-z0-9]{6,12}$/;

const DOCUMENT_PATTERNS: Readonly<Record<AssistedDocumentType, RegExp>> = { DNI, CE, PASSPORT };

function isPastIsoDate(value: string, now: Date): boolean {
  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime()) && date.getTime() <= now.getTime() && value >= OLDEST_BIRTH_DATE;
}

/**
 * Command used during the guided contracting flow to register who will use
 * Alivia in the household, with the accessibility profile that adapts the
 * service and an optional secondary emergency contact.
 */
export class RegisterAssistedPersonCommand {
  readonly values: AssistedPersonRegistrationValues;

  constructor(values: AssistedPersonRegistrationValues) {
    this.values = {
      ...values,
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      documentNumber: values.documentNumber.trim().toUpperCase(),
      phoneNumber: values.phoneNumber.trim(),
      emergencyContactName: values.emergencyContactName.trim(),
      emergencyContactPhone: values.emergencyContactPhone.trim(),
    };
  }

  /** Phone as E.164 digits (51987654321), or null when none was given. */
  get phoneNumber(): string | null {
    return this.values.phoneNumber === '' ? null : PhoneNumber.toE164Digits(this.values.phoneNumber);
  }

  /** Emergency contact phone as E.164 digits, or null when none was given. */
  get emergencyContactPhone(): string | null {
    const phone = this.values.emergencyContactPhone;
    return phone === '' ? null : PhoneNumber.toE164Digits(phone);
  }

  /** True when the client filled the optional emergency contact. */
  get hasEmergencyContact(): boolean {
    return this.values.emergencyContactName !== '' || this.values.emergencyContactPhone !== '';
  }

  /**
   * Validates the payload and returns the invalid fields, if any.
   * @param now - Reference date for the birth date check.
   */
  validate(now: Date = new Date()): FieldErrors<AssistedPersonRegistrationField> {
    const v = this.values;
    const errors: FieldErrors<AssistedPersonRegistrationField> = {};

    if (v.firstName === '') errors.firstName = 'required';
    else if (v.firstName.length > NAME_MAX_LENGTH) errors.firstName = 'too_long';

    if (v.lastName === '') errors.lastName = 'required';
    else if (v.lastName.length > NAME_MAX_LENGTH) errors.lastName = 'too_long';

    if (v.birthDate === '') errors.birthDate = 'required';
    else if (!isPastIsoDate(v.birthDate, now)) errors.birthDate = 'invalid_date';

    if (v.documentNumber !== '') {
      if (!DOCUMENT_PATTERNS[v.documentType].test(v.documentNumber)) {
        errors.documentNumber = v.documentType === 'DNI' ? 'invalid_dni' : 'invalid';
      }
    }

    if (v.kinship === '') errors.kinship = 'required';

    if (v.phoneNumber !== '') {
      const phoneError = PhoneNumber.check(v.phoneNumber);
      if (phoneError) errors.phoneNumber = phoneError;
    }

    if (v.mobilityLevel === '') errors.mobilityLevel = 'required';

    if (this.hasEmergencyContact) {
      if (v.emergencyContactName === '') errors.emergencyContactName = 'required';
      else if (v.emergencyContactName.length > CONTACT_NAME_MAX_LENGTH) errors.emergencyContactName = 'too_long';
      const contactPhoneError = PhoneNumber.check(v.emergencyContactPhone);
      if (contactPhoneError) errors.emergencyContactPhone = contactPhoneError;
    }

    if (!v.consent) errors.consent = 'required';

    return errors;
  }

  /** Hides the document number so it is never logged. */
  toString(): string {
    return `RegisterAssistedPersonCommand(documentType=${this.values.documentType}, documentNumber=***)`;
  }
}
