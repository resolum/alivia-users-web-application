export {
  iamStore,
  initIam,
  signIn,
  signOut,
  requestPasswordReset,
  resetPassword,
} from './application/iam.store.ts';
export type { IamState, IamStatus } from './application/iam.store.ts';

export { IAM_ERROR_CODES, IamError } from './domain/model/iam-error.ts';
export type { IamErrorCode } from './domain/model/iam-error.ts';
export { User } from './domain/model/user.entity.ts';
export { Role } from './domain/model/role.entity.ts';
export type { PortalAccessLevel } from './domain/model/role.entity.ts';
export type { AuthSession } from './domain/model/auth-session.ts';
export { EmailAddress } from './domain/model/valueobjects/email-address.ts';
export {
  ACCOUNT_STATUSES,
  ACCOUNT_TYPES,
  ROLES,
  TOKEN_PURPOSES,
  isAccountStatus,
  isAccountType,
  isRoles,
  isTokenPurpose,
} from './domain/model/iam.enums.ts';
export type {
  AccountStatus,
  AccountType,
  Roles,
  TokenPurpose,
} from './domain/model/iam.enums.ts';
export type {
  FieldErrorCode,
  FieldErrors,
} from './domain/model/field-errors.ts';
export { ForgotPasswordCommand } from './domain/model/forgot-password.command.ts';
export { SignInCommand } from './domain/model/sign-in.command.ts';
export { VerifyEmailCommand } from './domain/model/verify-email.command.ts';
export { ResendVerificationCodeCommand } from './domain/model/resend-verification-code.command.ts';
export {
  DefinePasswordCommand,
  createDefinePasswordCommandFromUrl,
} from './domain/model/reset-password.command.ts';
export {
  evaluatePassword,
  isStrongPassword,
  passwordsMatch,
} from './domain/model/password-policy.ts';
export type {
  PasswordRequirement,
  PasswordRequirementId,
} from './domain/model/password-policy.ts';

export { IamSessionProvider } from './presentation/IamSessionProvider.tsx';
export { IamAuthLayout } from './presentation/IamAuthLayout.tsx';
export { RequireAuth } from './presentation/guards/RequireAuth.tsx';
export { GuestOnly } from './presentation/guards/GuestOnly.tsx';
export { SignInView } from './presentation/views/SignInView.tsx';
export { ForgotPasswordView } from './presentation/views/ForgotPasswordView.tsx';
export { ResetPasswordView } from './presentation/views/ResetPasswordView.tsx';
export { PasswordUpdatedView } from './presentation/views/PasswordUpdatedView.tsx';
