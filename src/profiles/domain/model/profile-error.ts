export type ProfileFieldErrorCode =
  | 'required'
  | 'too_short'
  | 'too_long'
  | 'invalid_phone'
  | 'invalid_photo_type'
  | 'photo_too_large';

export type ProfileFieldErrors<TField extends string> = Partial<
  Record<TField, ProfileFieldErrorCode>
>;

export const PROFILE_ERROR_CODES = [
  'validation_failed',
  'forbidden',
  'not_found',
  'photo_upload_unavailable',
  'network',
  'unknown',
] as const;
export type ProfileErrorCode = (typeof PROFILE_ERROR_CODES)[number];

/** Failure of a profile operation, translated by the view through its code. */
export class ProfileError extends Error {
  readonly code: ProfileErrorCode;

  constructor(code: ProfileErrorCode) {
    super(code);
    this.name = 'ProfileError';
    this.code = code;
  }
}
