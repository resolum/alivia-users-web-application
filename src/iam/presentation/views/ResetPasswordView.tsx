import { useLocation } from 'react-router';
import { useDocumentTitle } from '@/shared/presentation/hooks/useDocumentTitle.ts';
import { useIamTranslations } from '../hooks/useIamTranslations.ts';
import { ResetPasswordForm } from './ResetPasswordForm.tsx';

function readEmail(state: unknown): string {
  if (typeof state !== 'object' || state === null || !('email' in state)) return '';
  return typeof state.email === 'string' ? state.email : '';
}

export function ResetPasswordView() {
  const t = useIamTranslations();
  useDocumentTitle(t.resetPassword.title);
  // Arriving from /recover-password brings the email; opened directly, the user types it.
  const email = readEmail(useLocation().state);

  return <ResetPasswordForm initialEmail={email} codeSent={email !== ''} />;
}
