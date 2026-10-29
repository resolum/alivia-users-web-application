import type { Translations } from '@/shared/presentation/i18n/index.ts';
import type { FieldErrorCode } from '../domain/model/field-errors.ts';

type FieldErrorKey = keyof Translations['iam']['fieldErrors'];

const FIELD_ERROR_KEYS: Readonly<Record<FieldErrorCode, FieldErrorKey>> = {
  required: 'required',
  invalid_email: 'invalidEmail',
  weak_password: 'weakPassword',
  password_mismatch: 'passwordMismatch',
  terms_not_accepted: 'termsNotAccepted',
  invalid_phone: 'invalidPhone',
  invalid_dni: 'invalidDni',
  invalid_date: 'invalidDate',
  too_long: 'tooLong',
  already_registered: 'alreadyRegistered',
  invalid: 'invalid',
};

/** Translates a field error code, or returns undefined when there is none. */
export function fieldErrorMessage(
  t: Translations['iam'],
  code: FieldErrorCode | undefined,
): string | undefined {
  return code === undefined ? undefined : t.fieldErrors[FIELD_ERROR_KEYS[code]];
}

/** Moves the focus to the first invalid field, following the form order. */
export function focusFirstInvalid(
  order: readonly string[],
  errors: Readonly<Partial<Record<string, unknown>>>,
  idPrefix: string,
): void {
  const field = order.find((name) => errors[name] !== undefined);
  if (field !== undefined) document.getElementById(`${idPrefix}-${field}`)?.focus();
}
