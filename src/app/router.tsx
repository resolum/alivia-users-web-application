import { createBrowserRouter, Navigate } from 'react-router';
import { AppLayout } from '@/shared/presentation/components/layout/AppLayout.tsx';
import { AuthLayout } from '@/shared/presentation/components/layout/AuthLayout.tsx';
import { HomeView } from '@/shared/presentation/views/home/HomeView.tsx';
import { PageNotFoundView } from '@/shared/presentation/views/page-not-found/PageNotFoundView.tsx';
import { PlaceholderPage } from '@/shared/presentation/views/placeholder-page/PlaceholderPage.tsx';
import { RequireAccess } from './RequireAccess.tsx';

/**
 * Application routes configuration.
 * Defines the routing structure for the React application, including lazy-loaded components and child routes.
 */
export const router = createBrowserRouter([
  {
    index: true,
    path: '/',
    element: <Navigate to="/home" replace />,
  },
  {
    element: <AppLayout />,
    children: [
      { path: 'home', element: <HomeView /> },
      { path: 'assisted-person', element: <PlaceholderPage title="Persona asistida" /> },
      { path: 'activities', element: <PlaceholderPage title="Actividades" /> },
      { path: 'notifications', element: <PlaceholderPage title="Notificaciones" /> },
      { path: 'profile', element: <PlaceholderPage title="Mi perfil" /> },
      {
        element: <RequireAccess required="principal" />,
        children: [
          { path: 'care-network', element: <PlaceholderPage title="Red de cuidado" /> },
          { path: 'household', element: <PlaceholderPage title="Hogar" /> },
          { path: 'subscription', element: <PlaceholderPage title="Suscripción" /> },
          { path: 'devices', element: <PlaceholderPage title="Dispositivos" /> },
          { path: 'incidents', element: <PlaceholderPage title="Incidencias" /> },
          { path: 'metrics', element: <PlaceholderPage title="Métricas" /> },
        ],
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
