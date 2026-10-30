import type { Responsibility } from './caregiver.entity.ts';

export type InvitationStatus = 'active' | 'expired' | 'accepted' | 'rejected';

/** What an invited caregiver sees before joining. Backend equivalent: Invitation. */
export interface Invitation {
  readonly token: string;
  readonly caregiverId: string;
  readonly email: string;
  readonly householdAlias: string;
  readonly assistedPersonName: string;
  readonly invitedByName: string;
  readonly invitedByRelationship: string;
  readonly responsibilities: readonly Responsibility[];
  readonly status: InvitationStatus;
}
