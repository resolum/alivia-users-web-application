import type { InputHTMLAttributes } from 'react';
import { inputBase } from '@/shared/presentation/components/base-form/Inputs.tsx';
import { useIamTranslations } from '../hooks/useIamTranslations.ts';
import { AuthField } from './AuthField.tsx';

interface RegistrationTextFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'onChange' | 'value'> {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly onValueChange: (value: string) => void;
  readonly error?: string;
  readonly hint?: string;
}

/** Required text input wired to its label, hint and error message. */
export function RegistrationTextField({
  id,
  label,
  value,
  onValueChange,
  error,
  hint,
  ...inputProps
}: RegistrationTextFieldProps) {
  const t = useIamTranslations();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <AuthField
      id={id}
      label={label}
      required
      requiredLabel={t.common.required}
      error={error}
      hint={hint}
    >
      <input
        id={id}
        required
        value={value}
        aria-invalid={error !== undefined}
        aria-describedby={describedBy}
        onChange={(event) => onValueChange(event.target.value)}
        className={[inputBase, 'min-h-12'].join(' ')}
        {...inputProps}
      />
    </AuthField>
  );
}
