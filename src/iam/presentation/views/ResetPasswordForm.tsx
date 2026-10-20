import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { PasswordField } from '@/shared/presentation/components/base-form/index.ts';
import type { FieldErrors } from '../../domain/model/field-errors.ts';
import {
  evaluatePassword,
  isStrongPassword,
  passwordsMatch,
} from '../../domain/model/password-policy.ts';
import { createDefinePasswordCommandFromUrl } from '../../domain/model/reset-password.command.ts';
import { AuthErrorAlert } from '../components/AuthErrorAlert.tsx';
import { AuthField } from '../components/AuthField.tsx';
import { AuthFormHeader } from '../components/AuthFormHeader.tsx';
import { AuthSubmitButton } from '../components/AuthSubmitButton.tsx';
import { PasswordRequirements } from '../components/PasswordRequirements.tsx';
import { useResetPassword } from '../hooks/useResetPassword.ts';
import { useIamTranslations } from '../hooks/useIamTranslations.ts';

interface ResetPasswordFormProps {
  readonly token: string;
  readonly purpose: string | null;
}

type ResetPasswordField = 'token' | 'newPassword' | 'confirmPassword';
type ResetPasswordFormErrors = FieldErrors<ResetPasswordField>;

export function ResetPasswordForm({
  token,
  purpose,
}: ResetPasswordFormProps) {
  const t = useIamTranslations();
  const navigate = useNavigate();
  const { status, errorKey, submit } = useResetPassword();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [errors, setErrors] = useState<ResetPasswordFormErrors>({});
  const requirements = evaluatePassword(password);
  const isSubmitting = status === 'submitting';
  const canSubmit = isStrongPassword(password) && confirmation.length > 0;
  const showNewLink =
    errorKey === 'invalidPasswordToken' || errorKey === 'passwordTokenExpired';

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const command = createDefinePasswordCommandFromUrl({
      token,
      purpose,
      newPassword: password,
    });
    const nextErrors: ResetPasswordFormErrors = command.validate();

    if (confirmation.length === 0) {
      nextErrors.confirmPassword = 'required';
    } else if (!passwordsMatch(password, confirmation)) {
      nextErrors.confirmPassword = 'password_mismatch';
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    if (await submit(command)) {
      navigate('/password-updated', { replace: true });
    }
  }

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
    <div className="space-y-6">
      <AuthFormHeader
        title={t.resetPassword.title}
        subtitle={t.resetPassword.subtitle}
      />
      <form
        noValidate
        onSubmit={(event) => void handleSubmit(event)}
        className="flex flex-col gap-4"
      >
        {errorKey && <AuthErrorAlert message={t.errors[errorKey]} />}
        {showNewLink && (
          <Link
            to="/recover-password"
            className="text-sm font-semibold text-alivia-primary-mid underline-offset-4 hover:underline"
          >
            {t.resetPassword.requestNewLink}
          </Link>
        )}

        <AuthField
          id="reset-password"
          label={t.resetPassword.passwordLabel}
          required
          requiredLabel={t.common.required}
          error={passwordError}
        >
          <PasswordField
            id="reset-password"
            name="password"
            autoComplete="new-password"
            required
            value={password}
            aria-invalid={passwordError !== undefined}
            aria-describedby={
              passwordError ? 'reset-password-error' : undefined
            }
            onChange={(event) => {
              setPassword(event.target.value);
              setErrors((current) => ({
                ...current,
                newPassword: undefined,
                confirmPassword: undefined,
              }));
            }}
            showPasswordLabel={t.common.showPassword}
            hidePasswordLabel={t.common.hidePassword}
          />
        </AuthField>
        <PasswordRequirements requirements={requirements} />

        <AuthField
          id="reset-password-confirm"
          label={t.resetPassword.confirmLabel}
          required
          requiredLabel={t.common.required}
          error={confirmationError}
        >
          <PasswordField
            id="reset-password-confirm"
            name="confirmPassword"
            autoComplete="new-password"
            required
            value={confirmation}
            aria-invalid={confirmationError !== undefined}
            aria-describedby={
              confirmationError ? 'reset-password-confirm-error' : undefined
            }
            onChange={(event) => {
              setConfirmation(event.target.value);
              setErrors((current) => ({ ...current, confirmPassword: undefined }));
            }}
            showPasswordLabel={t.common.showPassword}
            hidePasswordLabel={t.common.hidePassword}
          />
        </AuthField>

        <AuthSubmitButton
          label={t.resetPassword.submit}
          loading={isSubmitting}
          disabled={!canSubmit}
        />
      </form>
    </div>
  );
}
