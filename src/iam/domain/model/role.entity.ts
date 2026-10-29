import type { AccountType, Roles } from './iam.enums.ts';
import { isRoles } from './iam.enums.ts';

export type PortalAccessLevel = 'principal' | 'invitado';

const CORPORATE_ROLES: readonly Roles[] = [
  'ROLE_ADMIN',
  'ROLE_TECH',
  'ROLE_SUBSCRIPTION_MANAGER',
  'ROLE_CLEANING',
];
const EMPLOYEE_ROLES: readonly Roles[] = [
  'ROLE_TECH',
  'ROLE_SUBSCRIPTION_MANAGER',
  'ROLE_CLEANING',
];

/**
 * Catalog entity for access management roles. Backend equivalent: Role.
 */
export class Role {
  private readonly _name: Roles;

  /**
   * Initializes a new Role instance.
   * @param params - Role initialization parameters.
   */
  constructor(params: { name: Roles }) {
    this._name = params.name;
  }

  get name(): Roles {
    return this._name;
  }

  /**
   * Creates a role from its name, or returns null when the name is unknown.
   * @param name - Role name as sent by the API.
   */
  static fromName(name: string): Role | null {
    return isRoles(name) ? new Role({ name }) : null;
  }

  /**
   * Checks whether the role can be used by the given account type.
   * @param type - Account type to check.
   */
  allowedFor(type: AccountType): boolean {
    const isCorporate = CORPORATE_ROLES.includes(this._name);
    return type === 'CORPORATE' ? isCorporate : !isCorporate;
  }

  /**
   * Indicates whether the role belongs to an employee.
   */
  isEmployeeRole(): boolean {
    return EMPLOYEE_ROLES.includes(this._name);
  }

  /**
   * Access level in the users web portal, or null when the role belongs to
   * another web application (administrators and employees).
   */
  get portalAccessLevel(): PortalAccessLevel | null {
    if (this._name === 'ROLE_RELATIVE') {
      return 'principal';
    }
    return this._name === 'ROLE_CAREGIVER' ? 'invitado' : null;
  }
}
