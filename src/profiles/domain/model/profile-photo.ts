import type { ProfileFieldErrorCode } from './profile-error.ts';

export const PROFILE_PHOTO_TYPES = ['image/jpeg', 'image/png'] as const;
export const PROFILE_PHOTO_MAX_BYTES = 5 * 1024 * 1024;

/** Validates a candidate profile photo before it is uploaded. */
export function checkProfilePhoto(file: {
  readonly type: string;
  readonly size: number;
}): ProfileFieldErrorCode | null {
  if (!(PROFILE_PHOTO_TYPES as readonly string[]).includes(file.type)) {
    return 'invalid_photo_type';
  }
  return file.size > PROFILE_PHOTO_MAX_BYTES ? 'photo_too_large' : null;
}
