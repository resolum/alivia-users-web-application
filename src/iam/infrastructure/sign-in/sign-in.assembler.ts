import { UserId } from '@/shared/domain/model/valueobjects/user-id.ts';
import type { AuthSession } from '../../domain/model/auth-session.ts';
import type { AccountStatus, AccountType } from '../../domain/model/iam.enums.ts';
import { IamError } from '../../domain/model/iam-error.ts';
import { Role } from '../../domain/model/role.entity.ts';
import type { SignInCommand } from '../../domain/model/sign-in.command.ts';
import { User } from '../../domain/model/user.entity.ts';
import { EmailAddress } from '../../domain/model/valueobjects/email-address.ts';
import type { SignInRequest } from './sign-in.request.ts';
import type { AccountResource, SignInResponse } from './sign-in.response.ts';

/**
 * Backend access roles mapped to the portal roles.
 * PENDING(contract): CAREGIVER is the family member who contracts (principal);
 * the backend has no role yet for the invited caregiver.
 */
const BACKEND_ROLES: Readonly<Record<string, string>> = {
  CAREGIVER: 'ROLE_RELATIVE',
  ADMINISTRATOR: 'ROLE_ADMIN',
  TECHNICIAN: 'ROLE_TECH',
  SUBSCRIPTION_MANAGER: 'ROLE_SUBSCRIPTION_MANAGER',
};

const BACKEND_STATUSES: Readonly<Record<string, AccountStatus>> = {
  PENDING_VERIFICATION: 'PENDING',
  ACTIVE: 'ACTIVE',
  BLOCKED: 'BLOCKED',
  INACTIVE: 'DEACTIVATED',
};

// PENDING accounts may sign in: the backend lets them use the account until they verify the email.
function assertSignInAllowed(user: User): void {
  if (user.status === 'BLOCKED') {
    throw new IamError({ code: 'account_blocked' });
  }
  if (user.status === 'DEACTIVATED') {
    throw new IamError({ code: 'account_deactivated' });
  }
  if (user.portalAccessLevel === null) {
    throw new IamError({
      code: 'role_not_allowed',
      detail: 'Role is not enabled for the users web portal',
    });
  }
}

export class SignInAssembler {
  /**
   * Maps a SignInCommand to a SignInRequest for the API.
   */
  static toRequestFromCommand(command: SignInCommand): SignInRequest {
    return {
      email: command.emailAddress.trim().toLowerCase(),
      password: command.password,
    };
  }

  /**
   * Maps the account of a session to a User domain entity. This is the only
   * place that knows the response field names.
   */
  static toEntityFromResource(resource: AccountResource): User {
    const emailAddress = EmailAddress.of(resource.email);
    if (emailAddress === null) {
      throw new IamError({ code: 'unknown', detail: 'Invalid email in account resource' });
    }

    const status = BACKEND_STATUSES[resource.status];
    if (status === undefined) {
      throw new IamError({ code: 'unknown', detail: `Unknown account status: ${resource.status}` });
    }

    const role = Role.fromName(BACKEND_ROLES[resource.role] ?? resource.role);
    if (role === null) {
      throw new IamError({ code: 'role_not_allowed', detail: `Role not in this portal: ${resource.role}` });
    }

    const accountType: AccountType = role.allowedFor('CORPORATE') ? 'CORPORATE' : 'PERSONAL';
    const user = new User({
      id: UserId.of(resource.id),
      emailAddress,
      accountType,
      status,
      roles: [role],
      emailVerified: status !== 'PENDING',
      profileId: resource.profileId == null ? null : String(resource.profileId),
    });

    assertSignInAllowed(user);
    return user;
  }

  /**
   * Maps a SignInResponse to a domain session.
   */
  static toSessionFromResponse(response: SignInResponse): AuthSession {
    return {
      user: SignInAssembler.toEntityFromResource(response.user),
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      permissions: [...response.permissions],
    };
  }
}
