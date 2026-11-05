import type { AssistedPersonProps, DocumentType } from '../domain/model/assisted-person.entity.ts';
import { assistedPersons, caregivers } from './assistance.local-data.ts';

/** Assisted person registered during the contracting flow. */
export interface RegisteredAssistedPerson {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly documentType: DocumentType;
  /** Empty when the family did not register a document. */
  readonly documentNumber: string;
  /** ISO date (yyyy-mm-dd). */
  readonly birthDate: string;
  /** Kinship as shown to the family ("Madre / Padre"). */
  readonly kinship: string;
  /** E.164 digits (51912345678) or null. */
  readonly phone: string | null;
  readonly householdAlias: string;
}

function formatPhone(e164: string | null): string | null {
  if (e164 === null) return null;
  const local = e164.slice(2);
  return `+51 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
}

/**
 * shortcut: the assistance screens still read the browser copy, so the person
 * registered in the contracting flow replaces the Figma example there.
 */
export function showRegisteredAssistedPerson(person: RegisteredAssistedPerson): void {
  const principal = caregivers.all().find((caregiver) => caregiver.role === 'principal');
  const props: AssistedPersonProps = {
    id: person.id,
    firstName: person.firstName,
    lastName: person.lastName,
    documentType: person.documentType,
    documentNumber: person.documentNumber,
    documentValidated: false,
    birthDate: person.birthDate,
    kinship: person.kinship,
    phone: formatPhone(person.phone),
    photoUrl: null,
    householdAlias: person.householdAlias,
    principalCaregiverName: principal?.fullName ?? '',
    principalCaregiverKinship: '',
  };
  assistedPersons.replaceAll([props]);
}
