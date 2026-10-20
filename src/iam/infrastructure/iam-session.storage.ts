import { UserId } from '@/shared/domain/model/valueobjects/user-id.ts';
import {
  TokenStorage,
  type AuthTokens,
  type TokenPersistence,
} from '@/shared/infrastructure/token-storage.ts';
import { isRoles } from '../domain/model/iam.enums.ts';
import { Role } from '../domain/model/role.entity.ts';
import { User } from '../domain/model/user.entity.ts';
import { EmailAddress } from '../domain/model/valueobjects/email-address.ts';

const USER_SUMMARY_KEY = 'alivia.iam.user-summary';

interface UserSummary {
  readonly id: string;
  readonly emailAddress: string;
  readonly roles: readonly string[];
}

/** Session restored from browser storage, including the non-sensitive user. */
export interface StoredIamSession {
  readonly tokens: AuthTokens;
  readonly user: User | null;
}

function resolveStorage(persistence: TokenPersistence): Storage | null {
  if (typeof window === 'undefined') return null;
  return persistence === 'local' ? window.localStorage : window.sessionStorage;
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseRoles(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const items: readonly unknown[] = value;
  const roles: string[] = [];
  for (const item of items) {
    if (typeof item !== 'string' || !isRoles(item)) return null;
    roles.push(item);
  }
  return roles;
}

function parseUserSummary(value: unknown): UserSummary | null {
  if (!isRecord(value)) return null;

  const { id, emailAddress } = value;
  const roles = parseRoles(value.roles);
  if (
    typeof id !== 'string' ||
    typeof emailAddress !== 'string' ||
    roles === null
  ) {
    return null;
  }

  return { id, emailAddress, roles };
}

function readUserSummary(persistence: TokenPersistence): UserSummary | null {
  const storage = resolveStorage(persistence);
  if (storage === null) return null;

  try {
    const raw = storage.getItem(USER_SUMMARY_KEY);
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    return parseUserSummary(parsed);
  } catch {
    return null;
  }
}

function writeUserSummary(persistence: TokenPersistence, user: User): void {
  const storage = resolveStorage(persistence);
  if (storage === null) return;

  const summary: UserSummary = {
    id: user.id.getValue(),
    emailAddress: user.emailAddress.value,
    roles: user.roles.map((role) => role.name),
  };

  try {
    storage.setItem(USER_SUMMARY_KEY, JSON.stringify(summary));
  } catch {
    console.error('Error writing user summary');
  }
}

function clearUserSummaries(): void {
  const modes: readonly TokenPersistence[] = ['session', 'local'];
  for (const persistence of modes) {
    const storage = resolveStorage(persistence);
    if (storage === null) continue;
    try {
      storage.removeItem(USER_SUMMARY_KEY);
    } catch {
      console.error('Error clearing user summary');
    }
  }
}

function toUser(summary: UserSummary): User | null {
  const emailAddress = EmailAddress.of(summary.emailAddress);
  if (emailAddress === null) return null;

  const roles: Role[] = [];
  for (const name of summary.roles) {
    const role = Role.fromName(name);
    if (role === null) return null;
    roles.push(role);
  }

  return new User({
    id: UserId.of(summary.id),
    emailAddress,
    accountType: 'PERSONAL',
    status: 'ACTIVE',
    roles,
    emailVerified: true,
  });
}

/** Persists tokens and the non-sensitive user summary. */
export function saveSession(
  tokens: AuthTokens,
  remember: boolean,
  user: User,
): void {
  const persistence: TokenPersistence = remember ? 'local' : 'session';
  TokenStorage.save(tokens, persistence);
  writeUserSummary(persistence, user);
}

/** Updates tokens after a refresh, keeping the current persistence mode. */
export function saveRefreshedTokens(tokens: AuthTokens): void {
  const persistence = TokenStorage.read()?.persistence ?? 'session';
  TokenStorage.save(tokens, persistence);
}

/** Reads the stored session, if any. */
export function readStoredSession(): StoredIamSession | null {
  const stored = TokenStorage.read();
  if (stored === null) return null;

  const summary = readUserSummary(stored.persistence);
  return {
    tokens: {
      accessToken: stored.accessToken,
      refreshToken: stored.refreshToken,
    },
    user: summary === null ? null : toUser(summary),
  };
}

/** Reads the current access token for the BaseApi handler. */
export function readAccessToken(): string | null {
  return TokenStorage.read()?.accessToken ?? null;
}

/** Removes tokens and the user summary. */
export function clearSessionTokens(): void {
  TokenStorage.clear();
  clearUserSummaries();
}
