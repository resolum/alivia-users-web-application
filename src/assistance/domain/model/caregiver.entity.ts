import type { BaseEntity } from '@/shared/domain/model/base-entity.ts';

export const RESPONSIBILITIES = [
  'view_activities',
  'manage_activities',
  'receive_notifications',
  'view_devices',
  'receive_device_alerts',
] as const;
export type Responsibility = (typeof RESPONSIBILITIES)[number];

export const RELATIONSHIPS = ['family', 'external_caregiver', 'health_professional', 'other'] as const;
export type Relationship = (typeof RELATIONSHIPS)[number];

/** principal: the relative who holds the service; the rest join by invitation. */
export type CaregiverRole = 'principal' | 'additional';

/** active: linked; pending: invitation sent; expired: invitation lapsed without an answer. */
export type CaregiverLinkStatus = 'active' | 'pending' | 'expired';

export interface CaregiverProps {
  readonly id: string;
  readonly fullName: string;
  readonly email: string;
  readonly phone: string | null;
  readonly role: CaregiverRole;
  readonly relationship: Relationship;
  /** Free-text kinship shown under the name ("Hija de la persona asistida"). */
  readonly relationshipDetail: string;
  readonly status: CaregiverLinkStatus;
  readonly responsibilities: readonly Responsibility[];
  /** ISO date the caregiver joined, null while the invitation is open. */
  readonly linkedSince: string | null;
  readonly invitedAt: string;
  readonly photoUrl: string | null;
}

/** A person in the care network of the assisted person. Backend equivalent: Caregiver / Relative. */
export class Caregiver implements BaseEntity {
  readonly id: string;
  readonly fullName: string;
  readonly email: string;
  readonly phone: string | null;
  readonly role: CaregiverRole;
  readonly relationship: Relationship;
  readonly relationshipDetail: string;
  readonly status: CaregiverLinkStatus;
  readonly responsibilities: readonly Responsibility[];
  readonly linkedSince: string | null;
  readonly invitedAt: string;
  readonly photoUrl: string | null;

  constructor(props: CaregiverProps) {
    this.id = props.id;
    this.fullName = props.fullName;
    this.email = props.email;
    this.phone = props.phone;
    this.role = props.role;
    this.relationship = props.relationship;
    this.relationshipDetail = props.relationshipDetail;
    this.status = props.status;
    this.responsibilities = props.responsibilities;
    this.linkedSince = props.linkedSince;
    this.invitedAt = props.invitedAt;
    this.photoUrl = props.photoUrl;
  }

  get isPrincipal(): boolean {
    return this.role === 'principal';
  }

  /** Only lapsed invitations can be sent again; pending ones are still valid. */
  get canResendInvitation(): boolean {
    return this.status === 'expired';
  }
}

export interface CareNetwork {
  readonly householdAlias: string;
  readonly assistedPersonName: string;
  readonly principal: Caregiver;
  readonly additional: readonly Caregiver[];
}
