import { useState, type FormEvent } from 'react';
import { Button } from '@/shared/presentation/components/ui/index.ts';
import {
  ChangePasswordCommand,
  type ChangePasswordField,
} from '../../domain/model/change-password.command.ts';
import type { FieldErrors } from '../../domain/model/field-errors.ts';
import { evaluatePassword, passwordsMatch } from '../../domain/model/password-policy.ts';
import { useChangePassword } from '../hooks/useChangePassword.ts';
import { useIamTranslations } from '../hooks/useIamTranslations.ts';
import { AuthNotice } from './AuthNotice.tsx';
import { AuthPasswordField } from './AuthPasswordField.tsx';
import { PasswordRequirements } from './PasswordRequirements.tsx';

interface ChangePasswordFormProps {
  readonly onCancel: () => void;
  /** Called after the backend saved the new password; the session stays open. */
  readonly onChanged: () => void;
}

type ChangePasswordFormErrors = FieldErrors<ChangePasswordField | 'confirmPassword'>;

const REQUIREMENTS_ID = 'change-password-requirements';

const FIELD_IDS: readonly [keyof ChangePasswordFormErrors, string][] = [
  ['currentPassword', 'change-password-current'],
  ['newPassword', 'change-password-new'],
  ['confirmPassword', 'change-password-confirm'],
];

/** Current password, new password and its confirmation, for a signed-in user. */
export function ChangePasswordForm({ onCancel, onChanged }: ChangePasswordFormProps) {
  const t = useIamTranslations();
  const { status, errorKey, submit } = useChangePassword();
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [errors, setErrors] = useState<ChangePasswordFormErrors>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const command = new ChangePasswordCommand({ currentPassword: current, newPassword: password });
    const nextErrors: ChangePasswordFormErrors = command.validate();
    if (confirmation.length === 0) {
      nextErrors.confirmPassword = 'required';
    } else if (!passwordsMatch(password, confirmation)) {
      nextErrors.confirmPassword = 'password_mismatch';
    }
    setErrors(nextErrors);

    const firstInvalid = FIELD_IDS.find(([field]) => nextErrors[field] !== undefined);
    if (firstInvalid) {
      document.getElementById(firstInvalid[1])?.focus();
      return;
    }

    if (await submit(command)) onChanged();
  }

  const currentError =
    errors.currentPassword === 'required' ? t.changePassword.errors.currentRequired : undefined;
  const passwordError =
    errors.newPassword === 'required'
      ? t.resetPassword.errors.passwordRequired
      : errors.newPassword === 'weak_password'
        ? t.resetPassword.errors.passwordWeak
        : undefined;
  const confirmationError =
    errors.confirmPassword === 'required'
      ? t.resetPassword.errors.confirmRequired
      : errors.confirmPassword === 'password_mismatch'
        ? t.resetPassword.errors.passwordMismatch
        : undefined;

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
      {errorKey && <AuthNotice tone="error">{t.errors[errorKey]}</AuthNotice>}

      <AuthPasswordField
        id="change-password-current"
        label={t.changePassword.currentLabel}
        autoComplete="current-password"
        value={current}
        onValueChange={(value) => {
          setCurrent(value);
          setErrors((previous) => ({ ...previous, currentPassword: undefined }));
        }}
        error={currentError}
      />

      <AuthPasswordField
        id="change-password-new"
        label={t.resetPassword.passwordLabel}
        autoComplete="new-password"
        value={password}
        describedBy={REQUIREMENTS_ID}
        onValueChange={(value) => {
          setPassword(value);
          setErrors((previous) => ({ ...previous, newPassword: undefined, confirmPassword: undefined }));
        }}
        error={passwordError}
      />
      <div id={REQUIREMENTS_ID} className="-mt-2">
        <PasswordRequirements requirements={evaluatePassword(password)} />
      </div>

      <AuthPasswordField
        id="change-password-confirm"
        label={t.resetPassword.confirmLabel}
        autoComplete="new-password"
        value={confirmation}
        onValueChange={(value) => {
          setConfirmation(value);
          setErrors((previous) => ({ ...previous, confirmPassword: undefined }));
        }}
        error={confirmationError}
      />

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={onCancel}>
          {t.changePassword.cancel}
        </Button>
        <Button type="submit" loading={status === 'submitting'}>
          {t.changePassword.submit}
        </Button>
      </div>
    </form>
  );
}
