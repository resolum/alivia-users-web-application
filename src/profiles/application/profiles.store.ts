import type { PersonProfile } from '../domain/model/person-profile.entity.ts';
import { ProfileError } from '../domain/model/profile-error.ts';
import { checkProfilePhoto } from '../domain/model/profile-photo.ts';
import type { UpdateProfileCommand } from '../domain/model/update-profile.command.ts';
import { getProfilesApi } from '../infrastructure/profiles-api.ts';

type ProfileListener = (profile: PersonProfile) => void;
const listeners = new Set<ProfileListener>();

/** Lets other screens (the top bar) follow name and photo changes. Returns the unsubscribe. */
export function subscribeToProfile(listener: ProfileListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function publish(profile: PersonProfile): PersonProfile {
  listeners.forEach((listener) => listener(profile));
  return profile;
}

export function loadProfile(profileId: string): Promise<PersonProfile> {
  return getProfilesApi().getProfile(profileId).then(publish);
}

/** Callers validate first to show field errors; this guard keeps bad data off the wire. */
export function updateProfile(
  profile: PersonProfile,
  command: UpdateProfileCommand,
): Promise<PersonProfile> {
  if (Object.keys(command.validate()).length > 0) {
    return Promise.reject(new ProfileError('validation_failed'));
  }
  return getProfilesApi().updateProfile(profile, command).then(publish);
}

export function uploadProfilePhoto(profile: PersonProfile, file: File): Promise<PersonProfile> {
  if (checkProfilePhoto(file) !== null) {
    return Promise.reject(new ProfileError('validation_failed'));
  }
  return getProfilesApi().uploadPhoto(profile, file).then(publish);
}

export function removeProfilePhoto(profile: PersonProfile): Promise<PersonProfile> {
  return getProfilesApi().removePhoto(profile).then(publish);
}
