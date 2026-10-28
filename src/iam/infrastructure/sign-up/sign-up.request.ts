/**
 * Multipart fields of the sign-up request. Backend equivalent: SignUpResource.
 */
export interface SignUpRequest {
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly phoneNumber: string;
  readonly password: string;
  readonly acceptedTerms: string;
  readonly role: string;
  readonly dni: string;
  readonly birthDate: string;
}
