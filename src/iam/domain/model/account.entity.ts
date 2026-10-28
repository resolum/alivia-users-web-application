/**
 * Account created by the sign-up and confirmed by the email verification.
 * Backend equivalent: the public account of User (accountId).
 */
export class Account {
  private readonly _accountId: string;
  private readonly _status: string;
  private readonly _maskedEmail: string;

  /**
   * Initializes a new Account instance.
   * @param params - Account identifier, status and masked email, if known.
   */
  constructor(params: { accountId: string; status: string; maskedEmail?: string }) {
    this._accountId = params.accountId;
    this._status = params.status;
    this._maskedEmail = params.maskedEmail ?? '';
  }

  get accountId(): string {
    return this._accountId;
  }

  get status(): string {
    return this._status;
  }

  get maskedEmail(): string {
    return this._maskedEmail;
  }

  /**
   * Indicates whether the account still waits for its email verification.
   */
  get isPendingVerification(): boolean {
    return this._status === 'PENDING_VERIFICATION';
  }
}
