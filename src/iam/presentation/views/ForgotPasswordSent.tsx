import { AuthButton } from '../components/AuthButton.tsx';
import { AuthHeading } from '../components/AuthHeading.tsx';
import { AuthSuccessIcon } from '../components/AuthSuccessIcon.tsx';
import { useIamTranslations } from '../hooks/useIamTranslations.ts';

export function ForgotPasswordSent() {
  const t = useIamTranslations();

  return (
    <div role="status">
      <AuthHeading
        icon={<AuthSuccessIcon />}
        title={t.forgotPassword.confirmationTitle}
        description={t.forgotPassword.confirmation}
      />
      <div className="mt-8 animate-step-in [animation-delay:60ms]">
        <AuthButton to="/sign-in" variant="secondary" label={t.common.backToSignIn} />
      </div>
    </div>
  );
}
