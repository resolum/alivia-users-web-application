import type { BaseEntity } from '@/shared/domain/model/base-entity.ts';

export interface HouseholdAddress {
  readonly line: string;
  readonly district: string;
  readonly city: string;
  readonly reference: string;
  /** Set once operations confirms the address is inside the coverage area. */
  readonly validated: boolean;
}

export interface HouseholdProps {
  readonly id: string;
  readonly alias: string;
  /** International format, e.g. +51 984 123 456. */
  readonly phone: string;
  readonly email: string;
  readonly address: HouseholdAddress;
  readonly principalCaregiverName: string;
  readonly assistedPersonName: string;
}

/** The home where the service runs. Backend equivalent: HouseholdAccount (pending contract). */
export class Household implements BaseEntity {
  readonly id: string;
  readonly alias: string;
  readonly phone: string;
  readonly email: string;
  readonly address: HouseholdAddress;
  readonly principalCaregiverName: string;
  readonly assistedPersonName: string;

  constructor(props: HouseholdProps) {
    this.id = props.id;
    this.alias = props.alias;
    this.phone = props.phone;
    this.email = props.email;
    this.address = props.address;
    this.principalCaregiverName = props.principalCaregiverName;
    this.assistedPersonName = props.assistedPersonName;
  }

  get mapQuery(): string {
    return [this.address.line, this.address.district, this.address.city, 'Perú'].filter(Boolean).join(', ');
  }
}
