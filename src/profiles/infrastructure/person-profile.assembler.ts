import { PersonProfile } from '../domain/model/person-profile.entity.ts';
import type { UpdateProfileCommand } from '../domain/model/update-profile.command.ts';
import type { PersonProfileResource, UpdatePersonProfileRequest } from './person-profile.resources.ts';

export const PersonProfileAssembler = {
  toEntity(resource: PersonProfileResource): PersonProfile {
    return new PersonProfile({
      ...resource,
      id: String(resource.id),
      photoUrl: resource.photoUrl || null,
      photoPublicId: resource.photoPublicId || null,
    });
  },

  /**
   * PUT replaces every field, so values the screen does not edit are copied
   * from the current profile; `changes` overrides them.
   */
  toUpdateRequest(
    profile: PersonProfile,
    changes: Partial<UpdatePersonProfileRequest> = {},
  ): UpdatePersonProfileRequest {
    return {
      firstName: profile.firstName,
      lastName: profile.lastName,
      birthDate: profile.birthDate,
      phoneNumber: profile.phoneNumber,
      photoUrl: profile.photoUrl,
      photoPublicId: profile.photoPublicId,
      ...changes,
    };
  },

  toUpdateRequestFromCommand(
    profile: PersonProfile,
    command: UpdateProfileCommand,
  ): UpdatePersonProfileRequest {
    return PersonProfileAssembler.toUpdateRequest(profile, {
      firstName: command.firstName,
      lastName: command.lastName,
      phoneNumber: command.phoneNumber,
    });
  },
};
