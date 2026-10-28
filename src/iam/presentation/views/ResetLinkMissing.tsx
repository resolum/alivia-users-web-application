import { AuthBackLink } from '../components/AuthBackLink.tsx';
import { AuthButton } from '../components/AuthButton.tsx';
import { AuthHeading } from '../components/AuthHeading.tsx';
import { useIamTranslations } from '../hooks/useIamTranslations.ts';

export function ResetLinkMissing() {
  const t = useIamTranslations();

  return (
    <>
      <AuthHeading
        title={t.resetPassword.linkMissingTitle}
        description={t.resetPassword.tokenMissing}
      />
      <div className="mt-8 animate-step-in [animation-delay:60ms]">
        <AuthButton to="/recover-password" label={t.resetPassword.requestNewLink} />
      </div>
      <div className="mt-6">
        <AuthBackLink to="/sign-in" label={t.common.backToSignIn} />
      </div>
    </>
  );
}
