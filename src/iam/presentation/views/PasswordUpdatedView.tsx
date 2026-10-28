import { useDocumentTitle } from '@/shared/presentation/hooks/useDocumentTitle.ts';
import { AuthButton } from '../components/AuthButton.tsx';
import { AuthHeading } from '../components/AuthHeading.tsx';
import { AuthSuccessIcon } from '../components/AuthSuccessIcon.tsx';
import { useIamTranslations } from '../hooks/useIamTranslations.ts';

export function PasswordUpdatedView() {
  const t = useIamTranslations();
  useDocumentTitle(t.passwordUpdated.title);

  return (
    <div role="status">
      <AuthHeading
        icon={<AuthSuccessIcon />}
        title={t.passwordUpdated.title}
        description={t.passwordUpdated.message}
      />
      <div className="mt-8 animate-step-in [animation-delay:60ms]">
        <AuthButton to="/sign-in" label={t.passwordUpdated.submit} />
      </div>
    </div>
  );
}
