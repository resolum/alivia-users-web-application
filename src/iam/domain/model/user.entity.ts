import type { BaseEntity } from '@/shared/domain/model/base-entity.ts';
import type { UserId } from '@/shared/domain/model/valueobjects/user-id.ts';
import type { EmailAddress } from './valueobjects/email-address.ts';
import type { AccountStatus, AccountType, Roles } from './iam.enums.ts';
import type { PortalAccessLevel, Role } from './role.entity.ts';

/**
 * Aggregate root for a user account. Backend equivalent: User.
 * The password, the password token and the verification code are never exposed.
 */
export class User implements BaseEntity<UserId> {
  private readonly _id: UserId;
  private readonly _emailAddress: EmailAddress;
  private readonly _accountType: AccountType;
  private readonly _status: AccountStatus;
  private readonly _roles: Role[];
  private readonly _emailVerified: boolean;

  /**
   * Initializes a new User instance.
   * @param params - User initialization parameters.
   */
  constructor(params: {
    id: UserId;
    emailAddress: EmailAddress;
    accountType: AccountType;
    status: AccountStatus;
    roles: readonly Role[];
    emailVerified: boolean;
  }) {
    this._id = params.id;
    this._emailAddress = params.emailAddress;
    this._accountType = params.accountType;
    this._status = params.status;
    this._roles = [...params.roles];
    this._emailVerified = params.emailVerified;
  }

  get id(): UserId {
    return this._id;
  }

  get emailAddress(): EmailAddress {
    return this._emailAddress;
  }

  get accountType(): AccountType {
    return this._accountType;
  }

  get status(): AccountStatus {
    return this._status;
  }

  get roles(): Role[] {
    return [...this._roles];
  }

  get emailVerified(): boolean {
    return this._emailVerified;
  }

  /**
   * Indicates whether the account is currently active.
   */
  get isActive(): boolean {
    return this._status === 'ACTIVE';
  }

  /**
   * Checks whether the account has the given role.
   * @param role - Role name to check.
   */
  hasRole(role: Roles): boolean {
    return this._roles.some((item) => item.name === role);
  }

  /**
   * Access level in the users web portal (a personal account has a single
   * role), or null when the account does not belong to this portal.
   */
  get portalAccessLevel(): PortalAccessLevel | null {
    const level = this._roles
      .map((role) => role.portalAccessLevel)
      .find((item) => item !== null);
    return level ?? null;
  }
}
