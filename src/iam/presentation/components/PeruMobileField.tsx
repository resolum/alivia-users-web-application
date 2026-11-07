import type { InputHTMLAttributes } from 'react';
import { inputBase } from '@/shared/presentation/components/base-form/Inputs.tsx';
import { PERU_MOBILE_LENGTH, PhoneNumber } from '../../domain/model/valueobjects/phone-number.ts';
import { useIamTranslations } from '../hooks/useIamTranslations.ts';
import { AuthField } from './AuthField.tsx';

interface PeruMobileFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'onChange' | 'value' | 'type'> {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly onValueChange: (value: string) => void;
  readonly error?: string;
  readonly hint?: string;
  /** Optional fields drop the required marker; their label says "(Opcional)". */
  readonly optional?: boolean;
}

/**
 * Peruvian mobile input: a fixed +51 prefix and a field that only takes the
 * 9 local digits, so letters, spaces and extra digits never reach the form.
 */
export function PeruMobileField({
  id,
  label,
  value,
  onValueChange,
  error,
  hint,
  optional = false,
  ...inputProps
}: PeruMobileFieldProps) {
  const t = useIamTranslations();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <AuthField
      id={id}
      label={label}
      required={!optional}
      requiredLabel={t.common.required}
      error={error}
      hint={hint}
    >
      <div className="flex">
        <span
          aria-hidden="true"
          className="flex min-h-12 items-center rounded-l-lg border-r border-alivia-primary-mist bg-alivia-primary-mist px-3 text-sm font-semibold text-alivia-primary-dark"
        >
          +51
        </span>
        <input
          id={id}
          required={!optional}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          pattern="9[0-9]{8}"
          maxLength={PERU_MOBILE_LENGTH}
          placeholder="987654321"
          value={value}
          aria-invalid={error !== undefined}
          aria-describedby={describedBy}
          onChange={(event) => onValueChange(PhoneNumber.toLocalDigits(event.target.value))}
          className={[inputBase, 'min-h-12 rounded-l-none'].join(' ')}
          {...inputProps}
        />
      </div>
    </AuthField>
  );
}
