import type { ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { iamRoutes, RequireAuth } from '@/iam/index.ts';
import {
  NAV_ITEMS,
  type NavItemId,
} from '@/shared/presentation/components/navigator/navigation.catalog.ts';
import { HomeView } from '@/shared/presentation/views/home/HomeView.tsx';
import { NavPlaceholderPage } from '@/shared/presentation/views/placeholder-page/NavPlaceholderPage.tsx';
import { PageNotFoundView } from '@/shared/presentation/views/page-not-found/PageNotFoundView.tsx';
import { AppShell } from './shell/AppShell.tsx';
import { RequireAccess } from './RequireAccess.tsx';
import { PlanConfigurationView, PlanSelectionView, SubscriptionView } from '@/subscriptions/index.ts';
import { HouseholdView, ProfileView } from '@/profiles/index.ts';
import {
  ActivitiesView,
  AssistedPersonView,
  CareNetworkView,
  InvitationView,
  MedicationsView,
  ShiftsView,
} from '@/assistance/index.ts';
import { DevicesView } from '@/tracking/index.ts';
import { IncidentDetailView, IncidentRegisteredView, IncidentsView } from '@/operations/index.ts';
import { MetricsView } from '@/analytics/index.ts';
import { NotificationsView } from '@/communication/index.ts';

const NAV_VIEWS: Partial<Record<NavItemId, ReactNode>> = {
  home: <HomeView />,
  assistedPerson: <AssistedPersonView />,
  careNetwork: <CareNetworkView />,
  activities: <ActivitiesView />,
  shifts: <ShiftsView />,
  medications: <MedicationsView />,
  household: <HouseholdView />,
  devices: <DevicesView />,
  subscription: <SubscriptionView />,
  incidents: <IncidentsView />,
  metrics: <MetricsView />,
  profile: <ProfileView />,
  notifications: <NotificationsView />,
};

const navRoutes = [
  ...NAV_ITEMS.map((item) => ({
    path: item.route.slice(1),
    element: NAV_VIEWS[item.id] ?? <NavPlaceholderPage itemId={item.id} />,
  })),
  // Descendants of a catalog route inherit its access level in RequireAccess.
  { path: 'incidents/:id', element: <IncidentDetailView /> },
  { path: 'incidents/:id/registered', element: <IncidentRegisteredView /> },
];

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
  // Opened from the invitation e-mail, with or without a session.
  { path: 'invitations/:token', element: <InvitationView /> },
  ...iamRoutes,
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
