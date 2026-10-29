/** Request body for closing the session bound to a refresh token. */
export interface LogoutRequest {
  readonly refreshToken: string;
}
