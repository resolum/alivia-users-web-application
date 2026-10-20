/** Response body for a session refresh. */
export interface RefreshResponse {
  readonly accessToken: string;
  readonly refreshToken?: string;
}
