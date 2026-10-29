import { useEffect, useState, type FormEvent } from 'react';
import { resendVerification } from '../../application/iam.store.ts';
import type { FieldErrorCode } from '../../domain/model/field-errors.ts';
import { IamError } from '../../domain/model/iam-error.ts';
import { ResendVerificationCommand } from '../../domain/model/resend-verification.command.ts';
import { fieldErrorMessage } from '../field-error-message.ts';
import { useIamTranslations } from '../hooks/useIamTranslations.ts';
import { useSubmission } from '../hooks/useSubmission.ts';
import { AuthButton } from './AuthButton.tsx';
import { AuthNotice } from './AuthNotice.tsx';
import { AuthTextField } from './AuthTextField.tsx';

/** Client-side wait between resends; mirrors the backend default cooldown. */
const RESEND_COOLDOWN_SECONDS = 60;

interface ResendVerificationFormProps {
  readonly defaultEmail: string;
  /** True right after an email was sent, so the first resend waits. */
  readonly startInCooldown?: boolean;
  /** Primary when resending is the main action of the screen. */
  readonly variant?: 'primary' | 'secondary';
  /** Hides the "did not get the email?" title when the screen already explains it. */
  readonly hideTitle?: boolean;
}

function useCountdown(initialSeconds: number) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    if (seconds <= 0) return undefined;
    const timer = window.setTimeout(() => setSeconds((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [seconds]);

  return [seconds, setSeconds] as const;
}

export function ResendVerificationForm({
  defaultEmail,
  startInCooldown = false,
  variant = 'secondary',
  hideTitle = false,
}: ResendVerificationFormProps) {
  const t = useIamTranslations();
  const { status, errorKey, run } = useSubmission();
  const [email, setEmail] = useState(defaultEmail);
  const [emailError, setEmailError] = useState<FieldErrorCode | undefined>();
  const [secondsLeft, setSecondsLeft] = useCountdown(
    startInCooldown ? RESEND_COOLDOWN_SECONDS : 0,
  );
  const waiting = secondsLeft > 0;

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const command = new ResendVerificationCommand({ emailAddress: email.trim() });
    const error = command.validate().emailAddress;
    setEmailError(error);
    if (error || waiting) return;

    void run(async () => {
      try {
        await resendVerification(command);
        setSecondsLeft(RESEND_COOLDOWN_SECONDS);
      } catch (failure) {
        if (failure instanceof IamError && failure.code === 'rate_limited') {
          setSecondsLeft(failure.retryAfterSeconds ?? RESEND_COOLDOWN_SECONDS);
        }
        throw failure;
      }
    });
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
      {!hideTitle && (
        <h2 className="text-lg font-semibold text-alivia-primary">{t.resend.title}</h2>
      )}
      {status === 'success' && <AuthNotice tone="success">{t.resend.sent}</AuthNotice>}
      {errorKey && <AuthNotice tone="error">{t.errors[errorKey]}</AuthNotice>}

      <AuthTextField
        id="resend-email"
        label={t.resend.emailLabel}
        type="email"
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        placeholder={t.common.emailPlaceholder}
        value={email}
        onValueChange={(value) => {
          setEmail(value);
          setEmailError(undefined);
        }}
        error={fieldErrorMessage(t, emailError)}
      />

      <AuthButton
        variant={variant}
        label={waiting ? t.resend.wait.replace('{seconds}', String(secondsLeft)) : t.resend.submit}
        loading={status === 'submitting'}
        disabled={waiting}
      />
    </form>
  );
}
