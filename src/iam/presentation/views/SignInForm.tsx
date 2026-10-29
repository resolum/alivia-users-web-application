import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import type { FieldErrors } from '../../domain/model/field-errors.ts';
import { SignInCommand } from '../../domain/model/sign-in.command.ts';
import { AuthButton } from '../components/AuthButton.tsx';
import { AuthNotice } from '../components/AuthNotice.tsx';
import { AuthPasswordField } from '../components/AuthPasswordField.tsx';
import { AuthTextField } from '../components/AuthTextField.tsx';
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

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const command = new SignInCommand({
      emailAddress: email.trim(),
      password,
    });
    const nextErrors = command.validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      document.getElementById(nextErrors.emailAddress ? 'sign-in-email' : 'sign-in-password')?.focus();
      return;
    }

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
    errors.password === 'required' ? t.signIn.errors.passwordRequired : undefined;

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
      {errorKey && <AuthNotice tone="error">{t.errors[errorKey]}</AuthNotice>}
      {unexpectedSubmitFailure && <AuthNotice tone="error">{t.errors.unknown}</AuthNotice>}

      <AuthTextField
        id="sign-in-email"
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

      <AuthPasswordField
        id="sign-in-password"
        label={t.signIn.credentialLabel}
        autoComplete="current-password"
        value={password}
        onValueChange={(value) => {
          setPassword(value);
          setErrors((current) => ({ ...current, password: undefined }));
        }}
        error={passwordError}
        action={
          <Link
            to="/recover-password"
            className="-my-3 inline-flex min-h-11 items-center text-sm font-semibold text-alivia-primary-mid underline-offset-4 transition-colors duration-150 ease-out hover:text-alivia-primary hover:underline"
          >
            {t.signIn.forgotPassword}
          </Link>
        }
      />

      <label
        htmlFor="sign-in-remember"
        className="-my-1 inline-flex min-h-11 cursor-pointer items-center gap-2.5 self-start text-sm text-alivia-text select-none"
      >
        <input
          id="sign-in-remember"
          type="checkbox"
          checked={remember}
          onChange={(event) => setRemember(event.target.checked)}
          className="size-[1.125rem] cursor-pointer rounded accent-alivia-primary"
        />
        {t.signIn.remember}
      </label>

      <AuthButton label={t.signIn.submit} loading={status === 'submitting'} />
    </form>
  );
}
