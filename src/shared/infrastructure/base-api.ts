/**
 * Authentication handlers registered by a bounded context at start-up.
 *
 * Shared code uses them to attach the access token, renew an expired session
 * and clear local state when renewal fails, without importing any context.
 */
export interface AuthSessionHandlers {
  readonly getAccessToken: () => string | null;
  readonly refreshSession: () => Promise<void>;
  readonly onSessionExpired: () => void;
}

/** Options for an authenticated request. */
export interface BaseApiRequestOptions {
  readonly authenticated: boolean;
}

/** Thrown when an authenticated request cannot recover from a 401. */
export class SessionExpiredError extends Error {
  constructor() {
    super('Session expired');
    this.name = 'SessionExpiredError';
  }
}

/**
 * Marker base type for infrastructure API facades with shared auth handling.
 *
 * The registry is populated once by the session owner; BaseApi never imports a
 * bounded context.
 */
export abstract class BaseApi {
  private static authHandlers: AuthSessionHandlers | null = null;

  /** Registers the handlers used by authenticated requests. */
  static registerAuthHandlers(handlers: AuthSessionHandlers): void {
    BaseApi.authHandlers = handlers;
  }

  /**
   * Performs a request and, when authenticated, retries once after renewing the
   * session. A non-recoverable 401 clears the session and rejects.
   */
  static async request(
    url: string,
    init: RequestInit,
    options: BaseApiRequestOptions,
  ): Promise<Response> {
    const handlers = BaseApi.authHandlers;
    if (!options.authenticated || handlers === null) return fetch(url, init);

    const firstAttempt = await BaseApi.sendWithToken(url, init, handlers);
    if (firstAttempt.status !== 401) return firstAttempt;

    try {
      await handlers.refreshSession();
    } catch {
      handlers.onSessionExpired();
      throw new SessionExpiredError();
    }

    const retry = await BaseApi.sendWithToken(url, init, handlers);
    if (retry.status !== 401) return retry;

    handlers.onSessionExpired();
    throw new SessionExpiredError();
  }

  private static sendWithToken(
    url: string,
    init: RequestInit,
    handlers: AuthSessionHandlers,
  ): Promise<Response> {
    const headers = new Headers(init.headers);
    const accessToken = handlers.getAccessToken();
    if (accessToken !== null) headers.set('Authorization', `Bearer ${accessToken}`);
    return fetch(url, { ...init, headers });
  }
}
