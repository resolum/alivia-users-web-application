import type { Relationship, Responsibility } from './caregiver.entity.ts';

export type InviteField = 'email' | 'relationship' | 'responsibilities';
export type InviteFieldError = 'required' | 'invalid_email' | 'already_in_network' | 'none_selected';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class InviteCaregiverCommand {
  readonly email: string;
  readonly relationship: Relationship | '';
  readonly responsibilities: readonly Responsibility[];

  constructor(email: string, relationship: Relationship | '', responsibilities: readonly Responsibility[]) {
    this.email = email.trim().toLowerCase();
    this.relationship = relationship;
    this.responsibilities = responsibilities;
  }

  /** `takenEmails` holds the addresses already in the network, so nobody is invited twice. */
  validate(takenEmails: readonly string[] = []): Partial<Record<InviteField, InviteFieldError>> {
    const errors: Partial<Record<InviteField, InviteFieldError>> = {};
    if (this.email === '') errors.email = 'required';
    else if (!EMAIL_PATTERN.test(this.email)) errors.email = 'invalid_email';
    else if (takenEmails.some((taken) => taken.toLowerCase() === this.email)) errors.email = 'already_in_network';
    if (this.relationship === '') errors.relationship = 'required';
    if (this.responsibilities.length === 0) errors.responsibilities = 'none_selected';
    return errors;
  }
}
