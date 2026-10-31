import type { BaseEntity } from '@/shared/domain/model/base-entity.ts';

export const DOCUMENT_TYPES = ['DNI', 'CE', 'PASSPORT'] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export interface AssistedPersonProps {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly documentType: DocumentType;
  readonly documentNumber: string;
  /** Validated documents can no longer be edited from the caregiver web. */
  readonly documentValidated: boolean;
  /** ISO date (yyyy-mm-dd). */
  readonly birthDate: string;
  /** Kinship with the principal caregiver, as the assisted person is to them ("Padre"). */
  readonly kinship: string;
  readonly phone: string | null;
  readonly photoUrl: string | null;
  readonly householdAlias: string;
  readonly principalCaregiverName: string;
  /** How the principal caregiver relates back ("Hija"). */
  readonly principalCaregiverKinship: string;
}

/** The person who receives care. Backend equivalent: AssistedPerson (Asistencia Médica). */
export class AssistedPerson implements BaseEntity {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly documentType: DocumentType;
  readonly documentNumber: string;
  readonly documentValidated: boolean;
  readonly birthDate: string;
  readonly kinship: string;
  readonly phone: string | null;
  readonly photoUrl: string | null;
  readonly householdAlias: string;
  readonly principalCaregiverName: string;
  readonly principalCaregiverKinship: string;

  constructor(props: AssistedPersonProps) {
    this.id = props.id;
    this.firstName = props.firstName;
    this.lastName = props.lastName;
    this.documentType = props.documentType;
    this.documentNumber = props.documentNumber;
    this.documentValidated = props.documentValidated;
    this.birthDate = props.birthDate;
    this.kinship = props.kinship;
    this.phone = props.phone;
    this.photoUrl = props.photoUrl;
    this.householdAlias = props.householdAlias;
    this.principalCaregiverName = props.principalCaregiverName;
    this.principalCaregiverKinship = props.principalCaregiverKinship;
  }

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  ageAt(now: Date = new Date()): number {
    const [year, month, day] = this.birthDate.split('-').map(Number);
    const hadBirthday = now.getMonth() + 1 > month || (now.getMonth() + 1 === month && now.getDate() >= day);
    return now.getFullYear() - year - (hadBirthday ? 0 : 1);
  }

  /** Every field the care team relies on is filled in. */
  get isComplete(): boolean {
    return [this.firstName, this.lastName, this.documentNumber, this.birthDate, this.kinship, this.phone].every(
      (value) => value !== null && value.trim() !== '',
    );
  }
}
