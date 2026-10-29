import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import type { FieldErrors } from '../../domain/model/field-errors.ts';
import {
  evaluatePassword,
  isStrongPassword,
  passwordsMatch,
} from '../../domain/model/password-policy.ts';
import { createDefinePasswordCommandFromUrl } from '../../domain/model/reset-password.command.ts';
import { AuthButton } from '../components/AuthButton.tsx';
import { AuthHeading } from '../components/AuthHeading.tsx';
import { AuthNotice } from '../components/AuthNotice.tsx';
import { AuthPasswordField } from '../components/AuthPasswordField.tsx';
import { PasswordRequirements } from '../components/PasswordRequirements.tsx';
import { useResetPassword } from '../hooks/useResetPassword.ts';
import { useIamTranslations } from '../hooks/useIamTranslations.ts';

interface ResetPasswordFormProps {
  readonly token: string;
  readonly purpose: string | null;
}

type ResetPasswordField = 'token' | 'newPassword' | 'confirmPassword';
type ResetPasswordFormErrors = FieldErrors<ResetPasswordField>;

const REQUIREMENTS_ID = 'reset-password-requirements';

export function ResetPasswordForm({ token, purpose }: ResetPasswordFormProps) {
  const t = useIamTranslations();
  const navigate = useNavigate();
  const { status, errorKey, submit } = useResetPassword();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [unexpectedSubmitFailure, setUnexpectedSubmitFailure] = useState(false);
  const [errors, setErrors] = useState<ResetPasswordFormErrors>({});
  const canSubmit = isStrongPassword(password) && confirmation.length > 0;
  const linkExpired =
    errorKey === 'invalidPasswordToken' || errorKey === 'passwordTokenExpired';

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
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

    if (Object.keys(nextErrors).length > 0) {
      document
        .getElementById(nextErrors.newPassword ? 'reset-password' : 'reset-password-confirm')
        ?.focus();
      return;
    }

    setUnexpectedSubmitFailure(false);
    submit(command)
      .then((successful) => {
        if (successful) {
          void navigate('/password-updated', { replace: true });
        }
      })
      .catch(() => setUnexpectedSubmitFailure(true));
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
    <>
      <AuthHeading title={t.resetPassword.title} description={t.resetPassword.subtitle} />

      <form
        noValidate
        onSubmit={handleSubmit}
        className="mt-8 flex animate-step-in flex-col gap-5 [animation-delay:60ms]"
      >
        {errorKey && (
          <AuthNotice tone="error">
            {t.errors[errorKey]}
            {linkExpired && (
              <>
                {' '}
                <Link
                  to="/recover-password"
                  className="font-semibold underline underline-offset-4"
                >
                  {t.resetPassword.requestNewLink}
                </Link>
              </>
            )}
          </AuthNotice>
        )}
        {unexpectedSubmitFailure && <AuthNotice tone="error">{t.errors.unknown}</AuthNotice>}

        <AuthPasswordField
          id="reset-password"
          label={t.resetPassword.passwordLabel}
          autoComplete="new-password"
          value={password}
          describedBy={REQUIREMENTS_ID}
          onValueChange={(value) => {
            setPassword(value);
            setErrors((current) => ({
              ...current,
              newPassword: undefined,
              confirmPassword: undefined,
            }));
          }}
          error={passwordError}
        />
        <div id={REQUIREMENTS_ID} className="-mt-2">
          <PasswordRequirements requirements={evaluatePassword(password)} />
        </div>

        <AuthPasswordField
          id="reset-password-confirm"
          label={t.resetPassword.confirmLabel}
          autoComplete="new-password"
          value={confirmation}
          onValueChange={(value) => {
            setConfirmation(value);
            setErrors((current) => ({ ...current, confirmPassword: undefined }));
          }}
          error={confirmationError}
        />

        <AuthButton
          label={t.resetPassword.submit}
          loading={status === 'submitting'}
          disabled={!canSubmit}
        />
      </form>
    </>
  );
}
