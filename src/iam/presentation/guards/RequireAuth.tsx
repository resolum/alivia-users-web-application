import { Navigate, Outlet, useLocation } from 'react-router';
import { useIamTranslations } from '../hooks/useIamTranslations.ts';
import { useIamSession } from '../hooks/useIamSession.ts';
import { SessionLoading } from './SessionLoading.tsx';

export function RequireAuth() {
  const { status } = useIamSession();
  const location = useLocation();
  const t = useIamTranslations();

  if (status === 'loading') {
    return <SessionLoading label={t.common.loading} />;
  }

  if (status === 'unauthenticated') {
    const from = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to="/sign-in" replace state={{ from }} />;
  }

  return <Outlet />;
}
