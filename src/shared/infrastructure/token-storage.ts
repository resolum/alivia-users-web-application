export type TokenPersistence = 'session' | 'local';

export interface AuthTokens {
  readonly accessToken: string;
  readonly refreshToken: string;
}

/** Tokens plus the persistence mode they were read from. */
export interface StoredTokens extends AuthTokens {
  readonly persistence: TokenPersistence;
}

const ACCESS_TOKEN_KEY = 'alivia.iam.access-token';
const REFRESH_TOKEN_KEY = 'alivia.iam.refresh-token';

function resolveStorage(persistence: TokenPersistence): Storage | null {
  if (typeof window === 'undefined') return null;
  return persistence === 'local' ? window.localStorage : window.sessionStorage;
}

function readItem(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function writeItem(storage: Storage, key: string, value: string): void {
  try {
    storage.setItem(key, value);
  } catch {
    console.error('Error writing token to storage');
  }
}

function removeItem(storage: Storage, key: string): void {
  try {
    storage.removeItem(key);
  } catch {
    console.error('Error removing token from storage');
  }
}

function clearPersistence(persistence: TokenPersistence): void {
  const storage = resolveStorage(persistence);
  if (storage === null) return;
  removeItem(storage, ACCESS_TOKEN_KEY);
  removeItem(storage, REFRESH_TOKEN_KEY);
}

function readFrom(
  persistence: TokenPersistence,
): StoredTokens | null {
  const storage = resolveStorage(persistence);
  if (storage === null) return null;

  const accessToken = readItem(storage, ACCESS_TOKEN_KEY);
  const refreshToken = readItem(storage, REFRESH_TOKEN_KEY);
  if (accessToken === null || refreshToken === null) return null;

  return { accessToken, refreshToken, persistence };
}

/**
 * Browser-backed token storage with session or local persistence.
 */
export const TokenStorage = {
  save(tokens: AuthTokens, persistence: TokenPersistence): void {
    clearPersistence('session');
    clearPersistence('local');

    const storage = resolveStorage(persistence);
    if (storage === null) return;

    writeItem(storage, ACCESS_TOKEN_KEY, tokens.accessToken);
    writeItem(storage, REFRESH_TOKEN_KEY, tokens.refreshToken);
  },

  read(): StoredTokens | null {
    return readFrom('session') ?? readFrom('local');
  },

  clear(): void {
    clearPersistence('session');
    clearPersistence('local');
  },
};
