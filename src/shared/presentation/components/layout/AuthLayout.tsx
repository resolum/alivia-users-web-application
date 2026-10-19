import { Outlet } from 'react-router';

/**
 * Layout for authentication screens (sign-in, recover-password).
 * Centered card on a branded background.
 */
export function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-alivia-primary-mist px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <span className="text-2xl font-semibold text-alivia-primary">Alivia</span>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
