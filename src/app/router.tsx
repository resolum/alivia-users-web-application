import type { ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { AppLayout } from '@/shared/presentation/components/layout/AppLayout.tsx';
import { AuthLayout } from '@/shared/presentation/components/layout/AuthLayout.tsx';
import { NAV_ITEMS, type NavItemId } from '@/shared/presentation/components/navigator/navigation.catalog.ts';
import { HomeView } from '@/shared/presentation/views/home/HomeView.tsx';
import { NavPlaceholderPage } from '@/shared/presentation/views/placeholder-page/NavPlaceholderPage.tsx';
import { PageNotFoundView } from '@/shared/presentation/views/page-not-found/PageNotFoundView.tsx';
import { PlaceholderPage } from '@/shared/presentation/views/placeholder-page/PlaceholderPage.tsx';
import { RequireAccess } from './RequireAccess.tsx';

const NAV_VIEWS: Partial<Record<NavItemId, ReactNode>> = {
  home: <HomeView />,
};

const navRoutes = NAV_ITEMS.map((item) => ({
  path: item.route.slice(1),
  element: NAV_VIEWS[item.id] ?? <NavPlaceholderPage itemId={item.id} />,
}));

/**
 * Application routes configuration.
 * Route paths and access levels come from the navigation catalog.
 */
export const router = createBrowserRouter([
  {
    index: true,
    path: '/',
    element: <Navigate to="/home" replace />,
  },
  {
    element: <RequireAccess />,
    children: [
      {
        element: <AppLayout />,
        children: navRoutes,
      },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      { path: 'sign-in', element: <PlaceholderPage title="Iniciar sesión" /> },
      { path: 'recover-password', element: <PlaceholderPage title="Recuperar acceso" /> },
    ],
  },
  { path: '*', element: <PageNotFoundView /> },
]);
