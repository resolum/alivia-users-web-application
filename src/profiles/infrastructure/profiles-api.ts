import { BaseApi } from '@/shared/infrastructure/base-api.ts';
import type { PersonProfile } from '../domain/model/person-profile.entity.ts';
import { ProfileError, type ProfileErrorCode } from '../domain/model/profile-error.ts';
import type { UpdateProfileCommand } from '../domain/model/update-profile.command.ts';
import { PersonProfileAssembler } from './person-profile.assembler.ts';
import type { PersonProfileResource, UpdatePersonProfileRequest } from './person-profile.resources.ts';

export interface ProfilesApi {
  getProfile(profileId: string): Promise<PersonProfile>;
  updateProfile(profile: PersonProfile, command: UpdateProfileCommand): Promise<PersonProfile>;
  uploadPhoto(profile: PersonProfile, file: File): Promise<PersonProfile>;
  removePhoto(profile: PersonProfile): Promise<PersonProfile>;
}

const personProfilesUrl =
  `${import.meta.env.VITE_API_BASE_URL}/${import.meta.env.VITE_PROFILES_ENDPOINT_PATH ?? 'person-profiles'}`;

function toErrorCode(status: number): ProfileErrorCode {
  if (status === 400) return 'validation_failed';
  // The backend audits the attempt; the client only reports it was rejected.
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not_found';
  return 'unknown';
}

async function send(profileId: string, init: RequestInit): Promise<PersonProfile> {
  let response: Response;
  try {
    response = await BaseApi.request(
      `${personProfilesUrl}/${encodeURIComponent(profileId)}`,
      init,
      { authenticated: true },
    );
  } catch (error) {
    throw error instanceof TypeError ? new ProfileError('network') : error;
  }
  if (!response.ok) throw new ProfileError(toErrorCode(response.status));
  const resource: PersonProfileResource = await response.json();
  return PersonProfileAssembler.toEntity(resource);
}

const put = (profile: PersonProfile, body: UpdatePersonProfileRequest) =>
  send(profile.id, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

const httpProfilesApi: ProfilesApi = {
  getProfile: (profileId) => send(profileId, { method: 'GET' }),
  updateProfile: (profile, command) =>
    put(profile, PersonProfileAssembler.toUpdateRequestFromCommand(profile, command)),
  // shortcut: the API only uploads photos on sign-up; wire this once person-profiles exposes a photo upload.
  uploadPhoto: () => Promise.reject(new ProfileError('photo_upload_unavailable')),
  removePhoto: (profile) =>
    put(profile, PersonProfileAssembler.toUpdateRequest(profile, { photoUrl: null, photoPublicId: null })),
};

export function getProfilesApi(): ProfilesApi {
  return httpProfilesApi;
}
