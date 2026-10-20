import { AuthBackLink } from '../components/AuthBackLink.tsx';
import { AuthSuccessIcon } from '../components/AuthSuccessIcon.tsx';
import { useIamTranslations } from '../hooks/useIamTranslations.ts';

export function ForgotPasswordSent() {
  const t = useIamTranslations();

  return (
    <div role="status" className="space-y-6 text-center">
      <AuthSuccessIcon />
      <div className="space-y-2">
        <h1 className="text-2xl leading-tight font-bold text-alivia-primary">
          {t.forgotPassword.confirmationTitle}
        </h1>
        <p className="text-sm text-alivia-text-muted">
          {t.forgotPassword.confirmation}
        </p>
      </div>
      <div className="flex justify-center">
        <AuthBackLink to="/sign-in" label={t.common.backToSignIn} />
      </div>
    </div>
  );
}
