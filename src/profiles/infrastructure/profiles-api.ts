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

async function send(url: string, init: RequestInit): Promise<PersonProfile> {
  let response: Response;
  try {
    response = await BaseApi.request(url, init, { authenticated: true });
  } catch (error) {
    throw error instanceof TypeError ? new ProfileError('network') : error;
  }
  if (!response.ok) throw new ProfileError(toErrorCode(response.status));
  const resource: PersonProfileResource = await response.json();
  return PersonProfileAssembler.toEntity(resource);
}

const profileUrl = (profileId: string) => `${personProfilesUrl}/${encodeURIComponent(profileId)}`;

// The backend reads PUT as multipart/form-data; fetch sets the boundary when the body is FormData.
const put = (profile: PersonProfile, request: UpdatePersonProfileRequest, photo?: File) => {
  const body = new FormData();
  Object.entries(request).forEach(([field, value]) => body.append(field, value));
  if (photo) body.append('photo', photo);
  return send(profileUrl(profile.id), { method: 'PUT', body });
};

const httpProfilesApi: ProfilesApi = {
  getProfile: (profileId) => send(profileUrl(profileId), { method: 'GET' }),
  updateProfile: (profile, command) =>
    put(profile, PersonProfileAssembler.toUpdateRequestFromCommand(profile, command)),
  // PUT by id, not PATCH /profiles/me: the latter 404s for accounts whose user is not linked to the profile.
  uploadPhoto: (profile, file) => put(profile, PersonProfileAssembler.toUpdateRequest(profile), file),
  // shortcut: the multipart contract can replace the photo but not clear it; wire this once it can.
  removePhoto: () => Promise.reject(new ProfileError('photo_removal_unavailable')),
};

export function getProfilesApi(): ProfilesApi {
  return httpProfilesApi;
}
