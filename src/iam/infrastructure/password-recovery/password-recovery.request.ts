/** Body of POST /auth/forgot-password. */
export interface ForgotPasswordRequest {
  readonly email: string;
}

/** Body of POST /auth/reset-password: the 6-digit code sent by email and the new password. */
export interface ResetPasswordRequest {
  readonly email: string;
  readonly code: string;
  readonly password: string;
}

/** Body of PATCH /auth/change-password. */
export interface ChangePasswordRequest {
  readonly currentPassword: string;
  readonly newPassword: string;
}
