import { Navigate, Outlet } from 'react-router';
import { useIamTranslations } from '../hooks/useIamTranslations.ts';
import { useIamSession } from '../hooks/useIamSession.ts';
import { SessionLoading } from './SessionLoading.tsx';

export function GuestOnly() {
  const { status } = useIamSession();
  const t = useIamTranslations();

  if (status === 'loading') {
    return <SessionLoading label={t.common.loading} />;
  }
  if (status === 'authenticated') {
    return <Navigate to="/home" replace />;
  }
  return <Outlet />;
}
