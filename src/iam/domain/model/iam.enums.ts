export const ROLES = [
  'ROLE_ADMIN',
  'ROLE_TECH',
  'ROLE_SUBSCRIPTION_MANAGER',
  'ROLE_CLEANING',
  'ROLE_RELATIVE',
  'ROLE_CAREGIVER',
] as const;
export type Roles = (typeof ROLES)[number];

export const ACCOUNT_TYPES = ['PERSONAL', 'CORPORATE'] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const ACCOUNT_STATUSES = [
  'PENDING',
  'ACTIVE',
  'BLOCKED',
  'DEACTIVATED',
] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export const TOKEN_PURPOSES = ['SETUP', 'RESET'] as const;
export type TokenPurpose = (typeof TOKEN_PURPOSES)[number];

function isOneOf<T extends string>(list: readonly T[], value: string): value is T {
  return list.some((item) => item === value);
}

export const isRoles = (value: string): value is Roles => isOneOf(ROLES, value);
export const isAccountType = (value: string): value is AccountType =>
  isOneOf(ACCOUNT_TYPES, value);
export const isAccountStatus = (value: string): value is AccountStatus =>
  isOneOf(ACCOUNT_STATUSES, value);
export const isTokenPurpose = (value: string): value is TokenPurpose =>
  isOneOf(TOKEN_PURPOSES, value);
