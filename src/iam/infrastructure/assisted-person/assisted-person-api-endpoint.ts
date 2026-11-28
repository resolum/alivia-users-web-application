import { BaseApi } from '@/shared/infrastructure/base-api.ts';
import type { RegisterAssistedPersonCommand } from '../../domain/model/register-assisted-person.command.ts';
import { IamError } from '../../domain/model/iam-error.ts';
import { toIamErrorFromResponse } from '../iam-error.mapper.ts';
import { registerAssistedPersonLocally } from './assisted-person-fallback.ts';
import { toAssistedPersonRequest, type AssistedPersonResponse } from './assisted-person.request.ts';

const ASSISTED_PERSONS_PATH =
  import.meta.env.VITE_ASSISTED_PERSONS_ENDPOINT_PATH ??
  import.meta.env.VITE_ASSISTED_PERSON_CARE_PROFILE_ENDPOINT_PATH ??
  'assisted-persons';

/**
 * Endpoint for the assisted person, registered in the
 * contracting flow (POST /api/v1/assisted-persons).
 */
export class AssistedPersonApiEndpoint {
  /**
   * Saves the assisted person of the household.
   * @param householdId - Household created in the previous substep.
   * @param command - The validated command.
   * @returns A promise resolving to the identifier of the assisted person.
   */
  async register(householdId: string, command: RegisterAssistedPersonCommand): Promise<string> {
    const request = toAssistedPersonRequest(householdId, command);
    // shortcut: without endpoint path the profile stays in this browser.
    if (ASSISTED_PERSONS_PATH.trim() === '') return registerAssistedPersonLocally(request);

    const response = await BaseApi.request(
      `${import.meta.env.VITE_API_BASE_URL}/${ASSISTED_PERSONS_PATH}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      },
      { authenticated: true },
    );
    if (!response.ok) {
      throw toAssistedPersonError(response.status, await toIamErrorFromResponse(response, 'validation_failed'));
    }

    const data: AssistedPersonResponse = await response.json();
    return String(data.id);
  }
}

/**
 * Gives the Assistance problem codes a meaning the form can show: a DNI that is already registered marks the
 * document field, and a refused household or staff account is reported as an access problem.
 */
export function toAssistedPersonError(status: number, error: IamError): IamError {
  const detail = error.detail ?? '';
  if (status === 409 && /dni/i.test(detail)) {
    return new IamError({ code: 'validation_failed', detail, fieldErrors: { documentNumber: 'already_registered' } });
  }
  if (status === 403) {
    return new IamError({ code: 'role_not_allowed', detail });
  }
  return error;
}
