import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import {
  Checkbox,
  PasswordField,
} from '@/shared/presentation/components/base-form/index.ts';
import { inputBase } from '@/shared/presentation/components/base-form/Inputs.tsx';
import type { FieldErrors } from '../../domain/model/field-errors.ts';
import { SignInCommand } from '../../domain/model/sign-in.command.ts';
import { AuthErrorAlert } from '../components/AuthErrorAlert.tsx';
import { AuthField } from '../components/AuthField.tsx';
import { AuthSubmitButton } from '../components/AuthSubmitButton.tsx';
import { useSignIn } from '../hooks/useSignIn.ts';
import { useIamTranslations } from '../hooks/useIamTranslations.ts';

function resolveOrigin(state: unknown): string {
  if (typeof state !== 'object' || state === null || !('from' in state)) {
    return '/home';
  }

  const { from } = state;
  if (typeof from !== 'string' || !from.startsWith('/') || from.startsWith('//')) {
    return '/home';
  }

  return from.startsWith('/sign-in') ? '/home' : from;
}

export function SignInForm() {
  const t = useIamTranslations();
  const location = useLocation();
  const navigate = useNavigate();
  const { status, errorKey, submit } = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [unexpectedSubmitFailure, setUnexpectedSubmitFailure] = useState(false);
  const [errors, setErrors] = useState<
    FieldErrors<'emailAddress' | 'password'>
  >({});
  const isSubmitting = status === 'submitting';

  function clearError(field: 'emailAddress' | 'password'): void {
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const command = new SignInCommand({
      emailAddress: email.trim(),
      password,
    });
    const nextErrors = command.validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    setUnexpectedSubmitFailure(false);
    submit(command, remember)
      .then((successful) => {
        if (successful) {
          void navigate(resolveOrigin(location.state), { replace: true });
        }
      })
      .catch(() => setUnexpectedSubmitFailure(true));
  }

  const emailError =
    errors.emailAddress === 'required'
      ? t.common.emailRequired
      : errors.emailAddress === 'invalid_email'
        ? t.common.emailInvalid
        : undefined;
  const passwordError =
    errors.password === 'required'
      ? t.signIn.errors.passwordRequired
      : undefined;

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="flex flex-col gap-4"
    >
      {errorKey && <AuthErrorAlert message={t.errors[errorKey]} />}
      {unexpectedSubmitFailure && (
        <AuthErrorAlert message={t.errors.unknown} />
      )}

      <AuthField
        id="sign-in-email"
        label={t.common.emailLabel}
        required
        requiredLabel={t.common.required}
        error={emailError}
      >
        <input
          id="sign-in-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          placeholder={t.common.emailPlaceholder}
          aria-invalid={emailError !== undefined}
          aria-describedby={emailError ? 'sign-in-email-error' : undefined}
          onChange={(event) => {
            setEmail(event.target.value);
            clearError('emailAddress');
          }}
          className={[inputBase, 'min-h-12'].join(' ')}
        />
      </AuthField>

      <AuthField
        id="sign-in-password"
        label={t.signIn.credentialLabel}
        required
        requiredLabel={t.common.required}
        error={passwordError}
      >
        <PasswordField
          id="sign-in-password"
          name="password"
          autoComplete="current-password"
          required
          value={password}
          aria-invalid={passwordError !== undefined}
          aria-describedby={passwordError ? 'sign-in-password-error' : undefined}
          onChange={(event) => {
            setPassword(event.target.value);
            clearError('password');
          }}
          showPasswordLabel={t.common.showPassword}
          hidePasswordLabel={t.common.hidePassword}
        />
      </AuthField>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Checkbox
          id="sign-in-remember"
          label={t.signIn.remember}
          checked={remember}
          onChange={(event) => setRemember(event.target.checked)}
        />
        <Link
          to="/recover-password"
          className="inline-flex min-h-11 items-center text-sm font-semibold text-alivia-primary-mid hover:text-alivia-primary"
        >
          {t.signIn.forgotPassword}
        </Link>
      </div>

      <AuthSubmitButton label={t.signIn.submit} loading={isSubmitting} />
    </form>
  );
}
