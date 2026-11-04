/** Backend equivalent: PersonProfileResource. */
export interface PersonProfileResource {
  readonly id: number;
  readonly emailAddress: string;
  readonly photoUrl: string | null;
  readonly photoPublicId: string | null;
  readonly phoneNumber: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly dni: string;
  readonly birthDate: string;
}

/** Multipart fields of PUT /person-profiles/{profileId}; the optional `photo` file is sent apart. */
export interface UpdatePersonProfileRequest {
  readonly firstName: string;
  readonly lastName: string;
  readonly birthDate: string;
  readonly phoneNumber: string;
}
