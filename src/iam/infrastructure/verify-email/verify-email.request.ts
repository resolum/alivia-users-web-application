/** Body of POST /auth/verify-email: the registered email and the 6-digit code sent to it. */
export interface VerifyEmailRequest {
  readonly email: string;
  readonly code: string;
}
