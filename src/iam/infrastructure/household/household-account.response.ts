/** Response body for a created household account. PENDING(contract). */
export interface HouseholdAccountResponse {
  readonly id: string | number;
  readonly alias: string;
  readonly responsibleAccountId: string;
}
