import type { Household } from '../domain/model/household.entity.ts';
import type { UpdateHouseholdCommand } from '../domain/model/update-household.command.ts';
import { getHouseholdApi } from '../infrastructure/household-api.ts';

export const isHouseholdSample = () => getHouseholdApi().isSample;

export const loadHousehold = (): Promise<Household> => getHouseholdApi().getHousehold();

export function updateHousehold(household: Household, command: UpdateHouseholdCommand): Promise<Household> {
  if (Object.keys(command.validate()).length > 0) return Promise.reject(new Error('validation_failed'));
  return getHouseholdApi().updateHousehold(household, command);
}
