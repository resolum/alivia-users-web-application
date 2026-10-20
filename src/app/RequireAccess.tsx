import { Navigate, Outlet, useLocation } from 'react-router';
import { getNavItemByPath } from '@/shared/presentation/components/navigator/nav-selectors.ts';
import { useSession } from '@/shared/presentation/hooks/useSession.ts';

/**
 * Route guard that uses the navigation catalog as the single source of truth
 * for the access levels required by each route.
 */
export function RequireAccess() {
  const { accessLevel } = useSession();
  const { pathname } = useLocation();
  const item = getNavItemByPath(pathname);

  if (item && !item.accessLevels.includes(accessLevel)) {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
}
