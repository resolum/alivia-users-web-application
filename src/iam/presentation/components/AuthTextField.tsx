import type { InputHTMLAttributes } from 'react';
import { useIamTranslations } from '../hooks/useIamTranslations.ts';
import { AuthField } from './AuthField.tsx';

interface AuthTextFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'onChange' | 'value'> {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly onValueChange: (value: string) => void;
  readonly error?: string;
}

/**
 * Text input of the auth screens: visible 3.7:1 outline, 48px tall and 16px
 * text so iOS Safari does not zoom on focus.
 */
export function AuthTextField({
  id,
  label,
  value,
  onValueChange,
  error,
  ...inputProps
}: AuthTextFieldProps) {
  const t = useIamTranslations();

  return (
    <AuthField id={id} label={label} required quiet requiredLabel={t.common.required} error={error}>
      <input
        id={id}
        required
        value={value}
        aria-invalid={error !== undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(event) => onValueChange(event.target.value)}
        className="block min-h-12 w-full rounded-lg border border-alivia-field bg-white px-3.5 text-base text-alivia-text transition-colors duration-150 ease-out placeholder:text-alivia-hint hover:border-alivia-primary-mid focus:border-alivia-primary aria-[invalid=true]:border-alivia-danger"
        {...inputProps}
      />
    </AuthField>
  );
}
