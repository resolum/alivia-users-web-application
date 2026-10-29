import type { RouteObject } from 'react-router';
import { GuestOnly } from './guards/GuestOnly.tsx';
import { IamAuthLayout } from './IamAuthLayout.tsx';

const signInView = () =>
  import('./views/SignInView.tsx').then((m) => ({ Component: m.SignInView }));
const signUpView = () =>
  import('./views/SignUpView.tsx').then((m) => ({ Component: m.SignUpView }));
const emailSentView = () =>
  import('./views/EmailSentView.tsx').then((m) => ({ Component: m.EmailSentView }));
const verifyEmailView = () =>
  import('./views/VerifyEmailView.tsx').then((m) => ({ Component: m.VerifyEmailView }));
const householdAccountView = () =>
  import('./views/HouseholdAccountView.tsx').then((m) => ({ Component: m.HouseholdAccountView }));
const forgotPasswordView = () =>
  import('./views/ForgotPasswordView.tsx').then((m) => ({ Component: m.ForgotPasswordView }));
const resetPasswordView = () =>
  import('./views/ResetPasswordView.tsx').then((m) => ({ Component: m.ResetPasswordView }));
const passwordUpdatedView = () =>
  import('./views/PasswordUpdatedView.tsx').then((m) => ({ Component: m.PasswordUpdatedView }));

export const iamRoutes: RouteObject[] = [
  {
    Component: GuestOnly,
    children: [
      { path: 'sign-up', lazy: signUpView },
      { path: 'sign-up/email-sent', lazy: emailSentView },
      {
        Component: IamAuthLayout,
        children: [
          { path: 'sign-in', lazy: signInView },
          { path: 'recover-password', lazy: forgotPasswordView },
          { path: 'reset-password', lazy: resetPasswordView },
          { path: 'password-updated', lazy: passwordUpdatedView },
        ],
      },
    ],
  },
  // The backend verification link points to /verify-email?token=...; it can be
  // opened with or without a session, so it is not guest-only.
  { Component: IamAuthLayout, children: [{ path: 'verify-email', lazy: verifyEmailView }] },
  { path: 'household/new', lazy: householdAccountView },
];
