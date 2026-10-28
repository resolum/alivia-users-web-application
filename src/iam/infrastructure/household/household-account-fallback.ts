import { HouseholdAccount } from '../../domain/model/household-account.entity.ts';
import type { HouseholdAccountRequest } from './household-account.request.ts';

const LOCAL_HOUSEHOLD_KEY = 'alivia.iam.household-account';

/**
 * Keeps the household account in this browser while the backend has no
 * household endpoint.
 */
export function createHouseholdAccountLocally(request: HouseholdAccountRequest): HouseholdAccount {
  const household = new HouseholdAccount({
    id: crypto.randomUUID(),
    alias: request.alias,
    responsibleAccountId: request.responsibleAccountId,
  });
  try {
    window.localStorage.setItem(
      LOCAL_HOUSEHOLD_KEY,
      JSON.stringify({ ...request, id: household.id }),
    );
  } catch {
    console.error('Error writing household account');
  }
  return household;
}
