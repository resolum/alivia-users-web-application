import type { CreateHouseholdAccountCommand } from '../../domain/model/create-household-account.command.ts';
import { HouseholdAccount } from '../../domain/model/household-account.entity.ts';
import type { HouseholdAccountRequest } from './household-account.request.ts';
import type { HouseholdAccountResponse } from './household-account.response.ts';

export class HouseholdAccountAssembler {
  /**
   * Maps a CreateHouseholdAccountCommand to a HouseholdAccountRequest for the API.
   */
  static toRequestFromCommand(command: CreateHouseholdAccountCommand): HouseholdAccountRequest {
    return {
      responsibleAccountId: command.responsibleAccountId,
      alias: command.alias,
      phoneNumber: command.phoneNumber,
      contactEmail: command.contactEmail,
      address: command.address,
      district: command.district,
      city: command.city,
    };
  }

  /**
   * Maps a HouseholdAccountResponse to a HouseholdAccount domain entity.
   */
  static toEntityFromResponse(response: HouseholdAccountResponse): HouseholdAccount {
    return new HouseholdAccount({
      id: String(response.id),
      alias: response.alias,
      responsibleAccountId: response.responsibleAccountId,
    });
  }
}
