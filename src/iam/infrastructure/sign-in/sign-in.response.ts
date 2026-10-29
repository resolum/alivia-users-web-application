/** Account returned inside a session. Backend equivalent: AccountResource. */
export interface AccountResource {
  readonly id: string;
  readonly email: string;
  readonly role: string;
  readonly status: string;
  /** Person profile linked to the account; null until the profile exists. */
  readonly profileId?: number | string | null;
}

/**
 * Response body for sign-in and refresh.
 * Backend equivalent: AuthenticatedUserResource.
 */
export interface SignInResponse {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly tokenType: string;
  readonly expiresIn: number;
  readonly user: AccountResource;
  readonly permissions: readonly string[];
}
