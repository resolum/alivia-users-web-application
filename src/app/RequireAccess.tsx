import { Navigate, Outlet } from 'react-router';
import { useSession } from '@/shared/presentation/hooks/useSession.ts';
import type { AccessLevel } from '@/shared/presentation/session/session.types.ts';

interface RequireAccessProps {
  required: AccessLevel;
}

/**
 * Route guard that redirects to /home when the session access level
 * does not meet the required level.
 */
export function RequireAccess({ required }: RequireAccessProps) {
  const { accessLevel } = useSession();

  if (required === 'principal' && accessLevel !== 'principal') {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
}