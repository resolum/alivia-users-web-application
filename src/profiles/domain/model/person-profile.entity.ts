import type { BaseEntity } from '@/shared/domain/model/base-entity.ts';

export interface PersonProfileProps {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly dni: string;
  /** ISO date (yyyy-mm-dd). */
  readonly birthDate: string;
  readonly phoneNumber: string;
  readonly emailAddress: string;
  readonly photoUrl: string | null;
  /** Storage id of the photo, sent back untouched so the backend keeps or deletes it. */
  readonly photoPublicId: string | null;
}

/**
 * Personal profile of a person. Backend equivalent: PersonProfile.
 * DNI and email are owned by identity checks, so they are read-only here.
 */
export class PersonProfile implements BaseEntity {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly dni: string;
  readonly birthDate: string;
  readonly phoneNumber: string;
  readonly emailAddress: string;
  readonly photoUrl: string | null;
  readonly photoPublicId: string | null;

  constructor(props: PersonProfileProps) {
    this.id = props.id;
    this.firstName = props.firstName;
    this.lastName = props.lastName;
    this.dni = props.dni;
    this.birthDate = props.birthDate;
    this.phoneNumber = props.phoneNumber;
    this.emailAddress = props.emailAddress;
    this.photoUrl = props.photoUrl;
    this.photoPublicId = props.photoPublicId;
  }

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }
}
