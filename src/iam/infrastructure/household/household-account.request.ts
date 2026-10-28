/** Request body for creating the household account. PENDING(contract). */
export interface HouseholdAccountRequest {
  readonly responsibleAccountId: string;
  readonly alias: string;
  readonly phoneNumber: string;
  readonly contactEmail: string;
  readonly address: string;
  readonly district: string;
  readonly city: string;
}
