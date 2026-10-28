import type { ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import {
  ForgotPasswordView,
  GuestOnly,
  IamAuthLayout,
  PasswordUpdatedView,
  RequireAuth,
  ResetPasswordView,
  SignInView,
} from '@/iam/index.ts';
import {
  NAV_ITEMS,
  type NavItemId,
} from '@/shared/presentation/components/navigator/navigation.catalog.ts';
import { HomeView } from '@/shared/presentation/views/home/HomeView.tsx';
import { NavPlaceholderPage } from '@/shared/presentation/views/placeholder-page/NavPlaceholderPage.tsx';
import { PageNotFoundView } from '@/shared/presentation/views/page-not-found/PageNotFoundView.tsx';
import { AppShell } from './shell/AppShell.tsx';
import { RequireAccess } from './RequireAccess.tsx';
import { PlanConfigurationView, PlanSelectionView } from '@/subscriptions/index.ts';
import { EvaluationView } from '@/support/index.ts';

const NAV_VIEWS: Partial<Record<NavItemId, ReactNode>> = {
  home: <HomeView />,
};

const navRoutes = NAV_ITEMS.map((item) => ({
  path: item.route.slice(1),
  element: NAV_VIEWS[item.id] ?? <NavPlaceholderPage itemId={item.id} />,
}));

/**
 * Public auth screens live under GuestOnly; private screens require both a
 * session and the access level declared by the navigation catalog.
 */
export const router = createBrowserRouter([
  {
    index: true,
    path: '/',
    element: <Navigate to="/home" replace />,
  },
  { path: 'plans', element: <PlanSelectionView /> },
  { path: 'contract/configuration/:substep?', element: <PlanConfigurationView /> },
  { path: 'contract/evaluation/:substep?', element: <EvaluationView /> },
  {
    element: <GuestOnly />,
    children: [
      { path: 'sign-in', element: <SignInView /> },
      {
        element: <IamAuthLayout />,
        children: [
          { path: 'recover-password', element: <ForgotPasswordView /> },
          { path: 'reset-password', element: <ResetPasswordView /> },
          { path: 'password-updated', element: <PasswordUpdatedView /> },
        ],
      },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <RequireAccess />,
        children: [
          {
            element: <AppShell />,
            children: navRoutes,
          },
        ],
      },
    ],
  },
  { path: '*', element: <PageNotFoundView /> },
]);
