export type AssistanceErrorCode =
  | 'not_found'
  | 'forbidden'
  | 'conflict'
  | 'has_pending'
  | 'invitation_closed'
  | 'already_recorded';

export class AssistanceApiError extends Error {
  readonly code: AssistanceErrorCode;
  /** The record that already exists, for `already_recorded`. */
  readonly existing: unknown;

  constructor(code: AssistanceErrorCode, existing: unknown = null) {
    super(code);
    this.code = code;
    this.existing = existing;
    this.name = 'AssistanceApiError';
  }
}
