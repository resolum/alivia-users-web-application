import type { FieldErrors } from './field-errors.ts';
import { EmailAddress } from './valueobjects/email-address.ts';
import type { HouseholdLocation } from './valueobjects/household-location.ts';
import { PhoneNumber } from './valueobjects/phone-number.ts';

export type HouseholdField =
  | 'alias'
  | 'phoneNumber'
  | 'contactEmail'
  | 'address'
  | 'district'
  | 'city'
  | 'location';

/** Fields the client types; the location comes from the map. */
export type HouseholdTextField = Exclude<HouseholdField, 'location'>;

const ALIAS_MAX_LENGTH = 60;
const ADDRESS_MAX_LENGTH = 160;

/**
 * Command used to create the shared household account and link the verified
 * responsible client as its authorized responsible.
 */
export class CreateHouseholdAccountCommand {
  private readonly _responsibleAccountId: string;
  private readonly _alias: string;
  private readonly _phoneNumber: string;
  private readonly _contactEmail: string;
  private readonly _address: string;
  private readonly _district: string;
  private readonly _city: string;
  private readonly _location: HouseholdLocation | null;
  private readonly _locationRequired: boolean;

  /**
   * Initializes a new CreateHouseholdAccountCommand.
   * @param params - Household data and the verified responsible account.
   */
  constructor(params: {
    responsibleAccountId: string;
    alias: string;
    phoneNumber: string;
    contactEmail: string;
    address: string;
    district: string;
    city: string;
    /** Point picked on the map, if any. */
    location?: HouseholdLocation | null;
    /** True when the map is available, so the client must pick the point. */
    locationRequired?: boolean;
  }) {
    this._responsibleAccountId = params.responsibleAccountId;
    this._alias = params.alias.trim();
    this._phoneNumber = params.phoneNumber.trim();
    this._contactEmail = params.contactEmail.trim();
    this._address = params.address.trim();
    this._district = params.district.trim();
    this._city = params.city.trim();
    this._location = params.location ?? null;
    this._locationRequired = params.locationRequired ?? false;
  }

  get responsibleAccountId(): string {
    return this._responsibleAccountId;
  }

  get alias(): string {
    return this._alias;
  }

  /** Phone number as E.164 digits. */
  get phoneNumber(): string {
    return PhoneNumber.toE164Digits(this._phoneNumber) ?? this._phoneNumber;
  }

  get contactEmail(): string {
    return this._contactEmail.toLowerCase();
  }

  get address(): string {
    return this._address;
  }

  get district(): string {
    return this._district;
  }

  get city(): string {
    return this._city;
  }

  get location(): HouseholdLocation | null {
    return this._location;
  }

  /**
   * Validates the payload and returns the invalid fields, if any.
   */
  validate(): FieldErrors<HouseholdField> {
    const errors: FieldErrors<HouseholdField> = {};

    if (this._alias === '') errors.alias = 'required';
    else if (this._alias.length > ALIAS_MAX_LENGTH) errors.alias = 'too_long';

    const phoneError = PhoneNumber.check(this._phoneNumber);
    if (phoneError) errors.phoneNumber = phoneError;

    const emailError = EmailAddress.check(this._contactEmail);
    if (emailError) errors.contactEmail = emailError;

    if (this._address === '') errors.address = 'required';
    else if (this._address.length > ADDRESS_MAX_LENGTH) errors.address = 'too_long';

    if (this._district === '') errors.district = 'required';
    if (this._city === '') errors.city = 'required';
    if (this._locationRequired && this._location === null) errors.location = 'required';

    return errors;
  }
}
