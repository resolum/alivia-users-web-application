/** Response body for a created household account. */
export interface HouseholdAccountResponse {
  readonly id: string | number;
  readonly alias: string;
  readonly responsibleAccountId?: string | number | null;
}
