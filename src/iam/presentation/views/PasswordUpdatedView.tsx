import { useDocumentTitle } from '@/shared/presentation/hooks/useDocumentTitle.ts';
import { AuthLinkButton } from '../components/AuthLinkButton.tsx';
import { AuthSuccessIcon } from '../components/AuthSuccessIcon.tsx';
import { useIamTranslations } from '../hooks/useIamTranslations.ts';

export function PasswordUpdatedView() {
  const t = useIamTranslations();
  useDocumentTitle(t.passwordUpdated.title);

  return (
    <div role="status" className="space-y-6 text-center">
      <AuthSuccessIcon />
      <div className="space-y-2">
        <h1 className="text-2xl leading-tight font-bold text-alivia-primary">
          {t.passwordUpdated.title}
        </h1>
        <p className="text-sm text-alivia-text-muted">
          {t.passwordUpdated.message}
        </p>
      </div>
      <AuthLinkButton to="/sign-in" label={t.passwordUpdated.submit} />
    </div>
  );
}
