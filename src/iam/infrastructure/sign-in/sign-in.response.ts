import type { UserResource } from '../iam.resources.ts';

/** Response body for a successful sign-in. */
export interface SignInResponse {
  readonly accessToken: string;
  readonly refreshToken?: string | null;
  readonly user: UserResource;
  readonly permissions?: readonly string[];
}
