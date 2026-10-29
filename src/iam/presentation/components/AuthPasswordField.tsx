import type { ReactNode } from 'react';
import { PasswordField } from '@/shared/presentation/components/base-form/index.ts';
import { useIamTranslations } from '../hooks/useIamTranslations.ts';
import { AuthField } from './AuthField.tsx';

interface AuthPasswordFieldProps {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly onValueChange: (value: string) => void;
  readonly autoComplete: 'current-password' | 'new-password';
  readonly error?: string;
  /** Id of a block that explains the field, such as the password rules. */
  readonly describedBy?: string;
  readonly action?: ReactNode;
}

/**
 * Password input of the auth screens. The `!` classes override the tinted
 * shared input, which keeps its look in the registration screens.
 */
export function AuthPasswordField({
  id,
  label,
  value,
  onValueChange,
  autoComplete,
  error,
  describedBy,
  action,
}: AuthPasswordFieldProps) {
  const t = useIamTranslations();
  const ids = [error ? `${id}-error` : undefined, describedBy].filter(Boolean).join(' ');

  return (
    <AuthField
      id={id}
      label={label}
      required
      quiet
      requiredLabel={t.common.required}
      error={error}
      action={action}
    >
      <PasswordField
        id={id}
        name={id}
        autoComplete={autoComplete}
        required
        value={value}
        aria-invalid={error !== undefined}
        aria-describedby={ids === '' ? undefined : ids}
        onChange={(event) => onValueChange(event.target.value)}
        showPasswordLabel={t.common.showPassword}
        hidePasswordLabel={t.common.hidePassword}
        className="border-alivia-field! bg-white! px-3.5! text-base! hover:border-alivia-primary-mid! focus:border-alivia-primary! aria-[invalid=true]:border-alivia-danger!"
      />
    </AuthField>
  );
}
