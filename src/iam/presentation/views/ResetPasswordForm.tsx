import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import type { FieldErrors } from '../../domain/model/field-errors.ts';
import {
  evaluatePassword,
  isStrongPassword,
  passwordsMatch,
} from '../../domain/model/password-policy.ts';
import {
  ResetPasswordCommand,
  type ResetPasswordField,
} from '../../domain/model/reset-password.command.ts';
import { AuthBackLink } from '../components/AuthBackLink.tsx';
import { AuthButton } from '../components/AuthButton.tsx';
import { AuthHeading } from '../components/AuthHeading.tsx';
import { AuthNotice } from '../components/AuthNotice.tsx';
import { AuthPasswordField } from '../components/AuthPasswordField.tsx';
import { AuthTextField } from '../components/AuthTextField.tsx';
import { PasswordRequirements } from '../components/PasswordRequirements.tsx';
import { useResetPassword } from '../hooks/useResetPassword.ts';
import { useIamTranslations } from '../hooks/useIamTranslations.ts';

interface ResetPasswordFormProps {
  readonly initialEmail: string;
  /** True when the user just requested the code, so the screen confirms it was sent. */
  readonly codeSent: boolean;
}

type ResetPasswordFormErrors = FieldErrors<ResetPasswordField | 'confirmPassword'>;

const REQUIREMENTS_ID = 'reset-password-requirements';

/** Field ids in visual order, so the first invalid one gets the focus. */
const FIELD_IDS: readonly [keyof ResetPasswordFormErrors, string][] = [
  ['emailAddress', 'reset-email'],
  ['code', 'reset-code'],
  ['newPassword', 'reset-password'],
  ['confirmPassword', 'reset-password-confirm'],
];

export function ResetPasswordForm({ initialEmail, codeSent }: ResetPasswordFormProps) {
  const t = useIamTranslations();
  const navigate = useNavigate();
  const { status, errorKey, submit } = useResetPassword();
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [unexpectedSubmitFailure, setUnexpectedSubmitFailure] = useState(false);
  const [errors, setErrors] = useState<ResetPasswordFormErrors>({});
  const codeRejected = errorKey === 'invalidPasswordToken' || errorKey === 'passwordTokenExpired';

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const command = new ResetPasswordCommand({ emailAddress: email, code, newPassword: password });
    const nextErrors: ResetPasswordFormErrors = command.validate();

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

    setUnexpectedSubmitFailure(false);
    submit(command)
      .then((successful) => {
        if (successful) void navigate('/password-updated', { replace: true });
      })
      .catch(() => setUnexpectedSubmitFailure(true));
  }

  const emailError =
    errors.emailAddress === 'required'
      ? t.common.emailRequired
      : errors.emailAddress === 'invalid_email'
        ? t.common.emailInvalid
        : undefined;
  const codeError =
    errors.code === 'required'
      ? t.resetPassword.errors.codeRequired
      : errors.code === 'invalid'
        ? t.resetPassword.errors.codeInvalid
        : undefined;
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
        {codeSent && !errorKey && <AuthNotice tone="success">{t.resetPassword.codeSent}</AuthNotice>}
        {errorKey && (
          <AuthNotice tone="error">
            {t.errors[errorKey]}
            {codeRejected && (
              <>
                {' '}
                <Link to="/recover-password" className="font-semibold underline underline-offset-4">
                  {t.resetPassword.requestNewCode}
                </Link>
              </>
            )}
          </AuthNotice>
        )}
        {unexpectedSubmitFailure && <AuthNotice tone="error">{t.errors.unknown}</AuthNotice>}

        <AuthTextField
          id="reset-email"
          name="email"
          type="email"
          label={t.common.emailLabel}
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          placeholder={t.common.emailPlaceholder}
          value={email}
          onValueChange={(value) => {
            setEmail(value);
            setErrors((current) => ({ ...current, emailAddress: undefined }));
          }}
          error={emailError}
        />

        <AuthTextField
          id="reset-code"
          name="code"
          label={t.resetPassword.codeLabel}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          pattern="[0-9]{6}"
          value={code}
          onValueChange={(value) => {
            // Pasted codes often carry spaces; only digits reach the command.
            setCode(value.replace(/\D/g, '').slice(0, 6));
            setErrors((current) => ({ ...current, code: undefined }));
          }}
          error={codeError}
        />

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
          disabled={!isStrongPassword(password) || confirmation.length === 0}
        />
      </form>

      <div className="mt-6">
        <AuthBackLink to="/sign-in" label={t.common.backToSignIn} />
      </div>
    </>
  );
}
