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

/** Alias of the household kept in this browser, or an empty string. */
export function readLocalHouseholdAlias(): string {
  try {
    const raw = window.localStorage.getItem(LOCAL_HOUSEHOLD_KEY);
    const stored: unknown = raw === null ? null : JSON.parse(raw);
    if (typeof stored === 'object' && stored !== null && 'alias' in stored && typeof stored.alias === 'string') {
      return stored.alias;
    }
  } catch {
    console.error('Error reading household account');
  }
  return '';
}
