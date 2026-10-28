export type FieldErrorCode =
  | 'required'
  | 'invalid_email'
  | 'weak_password'
  | 'password_mismatch'
  | 'terms_not_accepted'
  | 'invalid_phone'
  | 'invalid_dni'
  | 'invalid_date'
  | 'too_long'
  | 'already_registered'
  | 'invalid';

export type FieldErrors<TField extends string> = Partial<
  Record<TField, FieldErrorCode>
>;
