import { useState, type FormEvent } from 'react';
import { inputBase } from '@/shared/presentation/components/base-form/Inputs.tsx';
import { useDocumentTitle } from '@/shared/presentation/hooks/useDocumentTitle.ts';
import type { FieldErrors } from '../../domain/model/field-errors.ts';
import { ForgotPasswordCommand } from '../../domain/model/forgot-password.command.ts';
import { AuthBackLink } from '../components/AuthBackLink.tsx';
import { AuthErrorAlert } from '../components/AuthErrorAlert.tsx';
import { AuthField } from '../components/AuthField.tsx';
import { AuthFormHeader } from '../components/AuthFormHeader.tsx';
import { AuthSubmitButton } from '../components/AuthSubmitButton.tsx';
import { useForgotPassword } from '../hooks/useForgotPassword.ts';
import { useIamTranslations } from '../hooks/useIamTranslations.ts';
import { ForgotPasswordSent } from './ForgotPasswordSent.tsx';

export function ForgotPasswordView() {
  const t = useIamTranslations();
  useDocumentTitle(t.forgotPassword.title);
  const { status, errorKey, submit } = useForgotPassword();
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<FieldErrors<'emailAddress'>>({});
  const isSubmitting = status === 'submitting';

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const command = new ForgotPasswordCommand({
      emailAddress: email.trim(),
    });
    const nextErrors = command.validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

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
    <div className="space-y-6">
      <AuthFormHeader
        title={t.forgotPassword.title}
        subtitle={t.forgotPassword.subtitle}
      />

      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
        {errorKey && <AuthErrorAlert message={t.errors[errorKey]} />}

        <AuthField
          id="recover-email"
          label={t.common.emailLabel}
          required
          requiredLabel={t.common.required}
          error={emailError}
        >
          <input
            id="recover-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            placeholder={t.common.emailPlaceholder}
            aria-invalid={emailError !== undefined}
            aria-describedby={emailError ? 'recover-email-error' : undefined}
            onChange={(event) => {
              setEmail(event.target.value);
              setErrors({});
            }}
            className={[inputBase, 'min-h-12'].join(' ')}
          />
        </AuthField>

        <AuthSubmitButton
          label={t.forgotPassword.submit}
          loading={isSubmitting}
        />
      </form>

      <AuthBackLink to="/sign-in" label={t.common.backToSignIn} />
    </div>
  );
}
