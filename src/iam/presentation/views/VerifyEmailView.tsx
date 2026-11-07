import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useDocumentTitle } from '@/shared/presentation/hooks/useDocumentTitle.ts';
import { getRegistrationProgress, verifyEmail } from '../../application/iam.store.ts';
import type { FieldErrors } from '../../domain/model/field-errors.ts';
import {
  VerifyEmailCommand,
  type VerifyEmailField,
} from '../../domain/model/verify-email.command.ts';
import { AuthButton } from '../components/AuthButton.tsx';
import { AuthHeading } from '../components/AuthHeading.tsx';
import { AuthNotice } from '../components/AuthNotice.tsx';
import { AuthTextField } from '../components/AuthTextField.tsx';
import { ResendVerificationForm } from '../components/ResendVerificationForm.tsx';
import { useSubmission } from '../hooks/useSubmission.ts';
import { useIamTranslations } from '../hooks/useIamTranslations.ts';

/** State passed to the household screen right after a verification. */
export interface VerifiedNavigationState {
  readonly emailVerified: true;
}

const FIELD_IDS: readonly [VerifyEmailField, string][] = [
  ['emailAddress', 'verify-email'],
  ['code', 'verify-code'],
];

export function VerifyEmailView() {
  const t = useIamTranslations();
  useDocumentTitle(t.verifyEmail.title);
  const navigate = useNavigate();
  const { status, errorKey, run } = useSubmission();
  const registeredEmail = getRegistrationProgress()?.emailAddress ?? '';
  const [email, setEmail] = useState(registeredEmail);
  const [code, setCode] = useState('');
  const [errors, setErrors] = useState<FieldErrors<VerifyEmailField>>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const command = new VerifyEmailCommand({ emailAddress: email, code });
    const nextErrors = command.validate();
    setErrors(nextErrors);

    const firstInvalid = FIELD_IDS.find(([field]) => nextErrors[field] !== undefined);
    if (firstInvalid) {
      document.getElementById(firstInvalid[1])?.focus();
      return;
    }

    if (await run(() => verifyEmail(command))) {
      const state: VerifiedNavigationState = { emailVerified: true };
      void navigate('/household/new', { replace: true, state });
    }
  }

  if (errorKey === 'emailAlreadyVerified') {
    return (
      <>
        <AuthHeading title={t.verifyEmail.title} description={t.verifyEmail.alreadyVerified} />
        <div className="mt-8 animate-step-in [animation-delay:60ms]">
          <AuthButton to="/sign-in" label={t.registration.signIn} />
        </div>
      </>
    );
  }

  const emailError =
    errors.emailAddress === 'required'
      ? t.common.emailRequired
      : errors.emailAddress === 'invalid_email'
        ? t.common.emailInvalid
        : undefined;
  const codeError =
    errors.code === 'required'
      ? t.verifyEmail.codeRequired
      : errors.code === 'invalid'
        ? t.verifyEmail.codeInvalid
        : undefined;

  return (
    <>
      <AuthHeading title={t.verifyEmail.title} description={t.verifyEmail.subtitle} />

      <form
        noValidate
        onSubmit={handleSubmit}
        className="mt-8 flex animate-step-in flex-col gap-5 [animation-delay:60ms]"
      >
        {errorKey && <AuthNotice tone="error">{t.errors[errorKey]}</AuthNotice>}

        <AuthTextField
          id="verify-email"
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
          id="verify-code"
          name="code"
          label={t.verifyEmail.codeLabel}
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

        <AuthButton label={t.verifyEmail.submit} loading={status === 'submitting'} />
      </form>

      <div className="mt-8 border-t border-slate-100 pt-6">
        <ResendVerificationForm defaultEmail={registeredEmail} />
      </div>
    </>
  );
}
