/** Response body for a verified account. Backend equivalent: VerifiedAccountResource. */
export interface VerifyEmailResponse {
  readonly accountId: string;
  readonly status: string;
}
