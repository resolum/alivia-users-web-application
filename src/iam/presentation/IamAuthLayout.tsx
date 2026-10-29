import { Outlet } from 'react-router';
import { AuthFrame } from './components/AuthFrame.tsx';

/** Shared frame of sign-in, password recovery and email verification. */
export function IamAuthLayout() {
  return (
    <AuthFrame>
      <Outlet />
    </AuthFrame>
  );
}
