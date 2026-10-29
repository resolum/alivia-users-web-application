/** Response body for a successful sign-up (HTTP 201). */
export interface SignUpResponse {
  readonly accountId: string;
  readonly maskedEmail: string;
  readonly status: string;
}
