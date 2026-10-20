export type FieldErrorCode =
  | 'required'
  | 'invalid_email'
  | 'weak_password'
  | 'password_mismatch';

export type FieldErrors<TField extends string> = Partial<
  Record<TField, FieldErrorCode>
>;
