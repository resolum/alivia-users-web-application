/**
 * User representation returned by the IAM API.
 * Backend equivalent: UserResource.
 */
export interface UserResource {
  readonly id: number;
  readonly emailAddress: string;
  readonly accountType: string;
  readonly status: string;
  readonly roles: readonly string[];
  readonly emailVerified: boolean;
}
