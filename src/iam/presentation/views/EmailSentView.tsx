import { Link } from 'react-router';
import { MailCheck } from 'lucide-react';
import { useDocumentTitle } from '@/shared/presentation/hooks/useDocumentTitle.ts';
import { getRegistrationProgress } from '../../application/iam.store.ts';
import { RegistrationLayout } from '../components/RegistrationLayout.tsx';
import { ResendVerificationForm } from '../components/ResendVerificationForm.tsx';
import { useIamTranslations } from '../hooks/useIamTranslations.ts';

export function EmailSentView() {
  const t = useIamTranslations();
  useDocumentTitle(t.emailSent.title);
  const progress = getRegistrationProgress();
  const pending = progress !== null && progress.maskedEmail !== '' && !progress.emailVerified;

  return (
    <RegistrationLayout step={2}>
      <div className="space-y-6">
        <div className="space-y-3">
          <span
            aria-hidden="true"
            className="flex size-14 items-center justify-center rounded-2xl bg-alivia-mint text-alivia-secondary-deep"
          >
            <MailCheck className="size-7" />
          </span>
          <h1 className="text-2xl leading-tight font-bold text-alivia-primary">
            {t.emailSent.title}
          </h1>
          {pending ? (
            <>
              <p className="text-sm text-alivia-text-muted">
                {t.emailSent.body.split('{email}')[0]}
                <strong className="font-semibold break-all text-alivia-text">
                  {progress.maskedEmail}
                </strong>
                {t.emailSent.body.split('{email}')[1]}
              </p>
              <p className="text-sm text-alivia-text-muted">{t.emailSent.hint}</p>
            </>
          ) : (
            <p className="text-sm text-alivia-text-muted">{t.emailSent.noRegistration}</p>
          )}
        </div>

        <div className="border-t border-slate-100 pt-6">
          <ResendVerificationForm
            defaultEmail={progress?.emailAddress ?? ''}
            startInCooldown={pending}
          />
        </div>

        <p className="text-sm text-alivia-text-muted">
          {t.emailSent.wrongEmail}{' '}
          <Link
            to="/sign-up"
            className="inline-flex min-h-11 items-center font-semibold text-alivia-primary underline-offset-4 hover:underline"
          >
            {t.emailSent.registerAgain}
          </Link>
        </p>
      </div>
    </RegistrationLayout>
  );
}
