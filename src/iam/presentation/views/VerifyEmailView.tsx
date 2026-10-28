import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useDocumentTitle } from '@/shared/presentation/hooks/useDocumentTitle.ts';
import { getRegistrationProgress, verifyEmail } from '../../application/iam.store.ts';
import { VerifyEmailCommand } from '../../domain/model/verify-email.command.ts';
import { toIamErrorKey, type IamErrorKey } from '../iam-error-keys.ts';
import { AuthButton } from '../components/AuthButton.tsx';
import { AuthHeading } from '../components/AuthHeading.tsx';
import { ResendVerificationForm } from '../components/ResendVerificationForm.tsx';
import { useIamTranslations } from '../hooks/useIamTranslations.ts';

/** State passed to the household screen right after a verification. */
export interface VerifiedNavigationState {
  readonly emailVerified: true;
}

export function VerifyEmailView() {
  const t = useIamTranslations();
  useDocumentTitle(t.verifyEmail.title);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = (searchParams.get('token') ?? '').trim();
  const [failure, setFailure] = useState<IamErrorKey | null>(null);

  useEffect(() => {
    if (token === '') return;
    let active = true;
    verifyEmail(new VerifyEmailCommand({ token }))
      .then(() => {
        const state: VerifiedNavigationState = { emailVerified: true };
        if (active) void navigate('/household/new', { replace: true, state });
      })
      .catch((error: unknown) => {
        if (active) setFailure(toIamErrorKey(error));
      });
    return () => {
      active = false;
    };
  }, [token, navigate]);

  if (token !== '' && failure === null) {
    return (
      <div role="status" className="flex animate-step-in items-center gap-4">
        <span
          aria-hidden="true"
          className="size-7 shrink-0 animate-spin rounded-full border-[3px] border-alivia-primary-mist border-t-alivia-primary"
        />
        <div>
          <h1 className="text-xl font-semibold tracking-[-0.01em] text-alivia-primary">
            {t.verifyEmail.title}
          </h1>
          <p className="mt-1 text-base text-alivia-text-muted">{t.verifyEmail.checking}</p>
        </div>
      </div>
    );
  }

  const alreadyVerified = failure === 'emailAlreadyVerified';
  const message =
    token === ''
      ? t.verifyEmail.missingToken
      : alreadyVerified
        ? t.verifyEmail.alreadyVerified
        : failure === 'network' || failure === 'serviceUnavailable' || failure === 'configuration'
          ? t.errors[failure]
          : t.verifyEmail.failedBody;

  return (
    <>
      <AuthHeading title={t.verifyEmail.failedTitle} description={message} />
      <div className="mt-8 animate-step-in [animation-delay:60ms]">
        {alreadyVerified ? (
          <AuthButton to="/sign-in" label={t.registration.signIn} />
        ) : (
          <ResendVerificationForm
            defaultEmail={getRegistrationProgress()?.emailAddress ?? ''}
            variant="primary"
            hideTitle
          />
        )}
      </div>
    </>
  );
}
