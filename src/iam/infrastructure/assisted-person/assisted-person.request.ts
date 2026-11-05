import type {
  AssistedDocumentType,
  Kinship,
  MobilityLevel,
  RegisterAssistedPersonCommand,
} from '../../domain/model/register-assisted-person.command.ts';

/**
 * Body of PUT /api/v1/assisted-person-care-profiles/mine. Phones are E.164
 * digits without the plus sign (51987654321).
 */
export interface AssistedPersonRequest {
  /** Numeric household id, or null while the household only lives in this browser. */
  readonly householdId: number | null;
  readonly firstName: string;
  readonly lastName: string;
  readonly birthDate: string;
  readonly documentType: AssistedDocumentType | null;
  readonly documentNumber: string | null;
  readonly kinship: Kinship;
  readonly phoneNumber: string | null;
  readonly mobilityLevel: MobilityLevel;
  readonly emergencyContactName: string | null;
  readonly emergencyContactPhone: string | null;
  readonly consentGiven: boolean;
}

/** Response of the care profile endpoints: the request fields plus these. */
export interface AssistedPersonResponse extends AssistedPersonRequest {
  readonly id: string | number;
  /** ISO instant. */
  readonly consentGivenAt: string;
}

function toHouseholdId(value: string): number | null {
  return /^\d+$/.test(value) ? Number(value) : null;
}

/** Maps the validated command to the request body. */
export function toAssistedPersonRequest(
  householdId: string,
  command: RegisterAssistedPersonCommand,
): AssistedPersonRequest {
  const v = command.values;
  const hasDocument = v.documentNumber !== '';
  const hasContact = command.hasEmergencyContact;
  return {
    householdId: toHouseholdId(householdId),
    firstName: v.firstName,
    lastName: v.lastName,
    birthDate: v.birthDate,
    documentType: hasDocument ? v.documentType : null,
    documentNumber: hasDocument ? v.documentNumber : null,
    kinship: v.kinship as Kinship,
    phoneNumber: command.phoneNumber,
    mobilityLevel: v.mobilityLevel as MobilityLevel,
    emergencyContactName: hasContact ? v.emergencyContactName : null,
    emergencyContactPhone: hasContact ? command.emergencyContactPhone : null,
    consentGiven: v.consent,
  };
}
