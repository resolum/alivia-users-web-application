import { AuthBackLink } from '../components/AuthBackLink.tsx';
import { AuthErrorAlert } from '../components/AuthErrorAlert.tsx';
import { AuthFormHeader } from '../components/AuthFormHeader.tsx';
import { AuthLinkButton } from '../components/AuthLinkButton.tsx';
import { useIamTranslations } from '../hooks/useIamTranslations.ts';

export function ResetLinkMissing() {
  const t = useIamTranslations();

  return (
    <div className="space-y-6">
      <AuthFormHeader
        title={t.resetPassword.title}
        subtitle={t.resetPassword.subtitle}
      />
      <AuthErrorAlert message={t.resetPassword.tokenMissing} />
      <AuthLinkButton
        to="/recover-password"
        label={t.resetPassword.requestNewLink}
      />
      <AuthBackLink to="/sign-in" label={t.common.backToSignIn} />
    </div>
  );
}
