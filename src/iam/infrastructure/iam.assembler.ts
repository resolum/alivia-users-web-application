import { UserId } from '@/shared/domain/model/valueobjects/user-id.ts';
import type { AuthSession } from '../domain/model/auth-session.ts';
import {
  isAccountStatus,
  isAccountType,
} from '../domain/model/iam.enums.ts';
import { IamError } from '../domain/model/iam-error.ts';
import { Role } from '../domain/model/role.entity.ts';
import { User } from '../domain/model/user.entity.ts';
import { EmailAddress } from '../domain/model/valueobjects/email-address.ts';
import type { UserResource } from './iam.resources.ts';
import type { SignInResponse } from './sign-in/sign-in.response.ts';

function assertSignInAllowed(user: User): void {
  if (user.status === 'PENDING') {
    throw new IamError({ code: 'account_pending' });
  }
  if (user.status === 'BLOCKED') {
    throw new IamError({ code: 'account_blocked' });
  }
  if (user.status === 'DEACTIVATED') {
    throw new IamError({ code: 'account_deactivated' });
  }
  if (!user.emailVerified) {
    throw new IamError({ code: 'email_not_verified' });
  }
  if (user.portalAccessLevel === null) {
    throw new IamError({
      code: 'role_not_allowed',
      detail: 'Role is not enabled for the users web portal',
    });
  }
}

/**
 * Maps one API user resource to a domain user.
 *
 * This is the only place that knows the response field names.
 * @param resource - User payload returned by the IAM API.
 */
export function toUserFromResource(resource: UserResource): User {
  const emailAddress = EmailAddress.of(resource.emailAddress);
  if (emailAddress === null) {
    throw new IamError({
      code: 'unknown',
      detail: 'Invalid email address in user resource',
    });
  }

  const accountType = resource.accountType;
  if (!isAccountType(accountType)) {
    throw new IamError({
      code: 'unknown',
      detail: `Unknown account type: ${accountType}`,
    });
  }

  const status = resource.status;
  if (!isAccountStatus(status)) {
    throw new IamError({
      code: 'unknown',
      detail: `Unknown account status: ${status}`,
    });
  }

  const roles: Role[] = [];
  for (const name of resource.roles) {
    const role = Role.fromName(name);
    if (role === null) {
      throw new IamError({
        code: 'unknown',
        detail: `Unknown role: ${name}`,
      });
    }
    roles.push(role);
  }

  const user = new User({
    id: UserId.of(String(resource.id)),
    emailAddress,
    accountType,
    status,
    roles,
    emailVerified: resource.emailVerified,
  });

  assertSignInAllowed(user);
  return user;
}

/**
 * Maps a sign-in response to a domain session.
 * @param resource - Successful sign-in payload.
 */
export function toSessionFromResource(resource: SignInResponse): AuthSession {
  return {
    user: toUserFromResource(resource.user),
    accessToken: resource.accessToken,
    refreshToken: resource.refreshToken ?? null,
    permissions: [...(resource.permissions ?? [])],
  };
}
