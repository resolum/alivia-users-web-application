import { useState, type FormEvent } from 'react';
import { useDocumentTitle } from '@/shared/presentation/hooks/useDocumentTitle.ts';
import type { FieldErrors } from '../../domain/model/field-errors.ts';
import { ForgotPasswordCommand } from '../../domain/model/forgot-password.command.ts';
import { AuthBackLink } from '../components/AuthBackLink.tsx';
import { AuthButton } from '../components/AuthButton.tsx';
import { AuthHeading } from '../components/AuthHeading.tsx';
import { AuthNotice } from '../components/AuthNotice.tsx';
import { AuthTextField } from '../components/AuthTextField.tsx';
import { useForgotPassword } from '../hooks/useForgotPassword.ts';
import { useIamTranslations } from '../hooks/useIamTranslations.ts';
import { ForgotPasswordSent } from './ForgotPasswordSent.tsx';

export function ForgotPasswordView() {
  const t = useIamTranslations();
  useDocumentTitle(t.forgotPassword.title);
  const { status, errorKey, submit } = useForgotPassword();
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<FieldErrors<'emailAddress'>>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const command = new ForgotPasswordCommand({ emailAddress: email.trim() });
    const nextErrors = command.validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      document.getElementById('recover-email')?.focus();
      return;
    }

    await submit(command);
  }

  if (status === 'success') return <ForgotPasswordSent />;

  const emailError =
    errors.emailAddress === 'required'
      ? t.common.emailRequired
      : errors.emailAddress === 'invalid_email'
        ? t.common.emailInvalid
        : undefined;

  return (
    <>
      <AuthHeading title={t.forgotPassword.title} description={t.forgotPassword.subtitle} />

      <form
        noValidate
        onSubmit={handleSubmit}
        className="mt-8 flex animate-step-in flex-col gap-5 [animation-delay:60ms]"
      >
        {errorKey && <AuthNotice tone="error">{t.errors[errorKey]}</AuthNotice>}

        <AuthTextField
          id="recover-email"
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
            setErrors({});
          }}
          error={emailError}
        />

        <AuthButton label={t.forgotPassword.submit} loading={status === 'submitting'} />
      </form>

      <div className="mt-6">
        <AuthBackLink to="/sign-in" label={t.common.backToSignIn} />
      </div>
    </>
  );
}
