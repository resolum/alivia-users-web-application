import { BaseApi } from '@/shared/infrastructure/base-api.ts';
import type { CreateHouseholdAccountCommand } from '../../domain/model/create-household-account.command.ts';
import type { HouseholdAccount } from '../../domain/model/household-account.entity.ts';
import { toIamErrorFromResponse } from '../iam-error.mapper.ts';
import { createHouseholdAccountLocally } from './household-account-fallback.ts';
import { HouseholdAccountAssembler } from './household-account.assembler.ts';
import type { HouseholdAccountResponse } from './household-account.response.ts';

const HOUSEHOLD_PATH = import.meta.env.VITE_IAM_HOUSEHOLD_ENDPOINT_PATH ?? '';
const householdApiUrl = `${import.meta.env.VITE_API_BASE_URL}/${HOUSEHOLD_PATH}`;

/**
 * Endpoint for the shared household account.
 */
export class HouseholdAccountApiEndpoint {
  /**
   * Creates the household account and links the responsible client.
   * @param command - The create-household-account command.
   * @returns A promise resolving to the created household account.
   */
  async create(command: CreateHouseholdAccountCommand): Promise<HouseholdAccount> {
    const request = HouseholdAccountAssembler.toRequestFromCommand(command);
    // shortcut: the backend has no household endpoint yet, so the data stays in this browser; set VITE_IAM_HOUSEHOLD_ENDPOINT_PATH once it exists.
    if (HOUSEHOLD_PATH.trim() === '') return createHouseholdAccountLocally(request);

    const response = await BaseApi.request(
      householdApiUrl,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      },
      { authenticated: false },
    );
    if (!response.ok) {
      throw await toIamErrorFromResponse(response, 'validation_failed');
    }

    const data: HouseholdAccountResponse = await response.json();
    return HouseholdAccountAssembler.toEntityFromResponse(data);
  }
}
