import { BaseApi } from '@/shared/infrastructure/base-api.ts';
import type { RegisterAssistedPersonCommand } from '../../domain/model/register-assisted-person.command.ts';
import { toIamErrorFromResponse } from '../iam-error.mapper.ts';
import { registerAssistedPersonLocally } from './assisted-person-fallback.ts';
import { toAssistedPersonRequest, type AssistedPersonResponse } from './assisted-person.request.ts';

const CARE_PROFILE_PATH = import.meta.env.VITE_ASSISTED_PERSON_CARE_PROFILE_ENDPOINT_PATH ?? '';

/**
 * Endpoint for the care profile of the assisted person, registered in the
 * contracting flow (PUT /api/v1/assisted-person-care-profiles/mine, upsert).
 */
export class AssistedPersonApiEndpoint {
  /**
   * Saves the care profile of the assisted person of the household.
   * @param householdId - Household created in the previous substep.
   * @param command - The validated command.
   * @returns A promise resolving to the identifier of the care profile.
   */
  async register(householdId: string, command: RegisterAssistedPersonCommand): Promise<string> {
    const request = toAssistedPersonRequest(householdId, command);
    // shortcut: without VITE_ASSISTED_PERSON_CARE_PROFILE_ENDPOINT_PATH the profile stays in this browser.
    if (CARE_PROFILE_PATH.trim() === '') return registerAssistedPersonLocally(request);

    const response = await BaseApi.request(
      `${import.meta.env.VITE_API_BASE_URL}/${CARE_PROFILE_PATH}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      },
      { authenticated: true },
    );
    if (!response.ok) {
      throw await toIamErrorFromResponse(response, 'validation_failed');
    }

    const data: AssistedPersonResponse = await response.json();
    return String(data.id);
  }
}
