import { useSearchParams } from 'react-router';
import { useDocumentTitle } from '@/shared/presentation/hooks/useDocumentTitle.ts';
import { useIamTranslations } from '../hooks/useIamTranslations.ts';
import { ResetLinkMissing } from './ResetLinkMissing.tsx';
import { ResetPasswordForm } from './ResetPasswordForm.tsx';

export function ResetPasswordView() {
  const t = useIamTranslations();
  useDocumentTitle(t.resetPassword.title);
  const [searchParams] = useSearchParams();
  const token = (searchParams.get('token') ?? '').trim();
  const purpose = searchParams.get('purpose');

  return token.length === 0 ? (
    <ResetLinkMissing />
  ) : (
    <ResetPasswordForm token={token} purpose={purpose} />
  );
}
