import { BaseApi } from '@/shared/infrastructure/base-api.ts';
import { toIamErrorFromResponse } from '../iam-error.mapper.ts';
import type { LogoutRequest } from './logout.request.ts';

const logoutApiUrl =
  `${import.meta.env.VITE_API_BASE_URL}/${import.meta.env.VITE_IAM_LOGOUT_ENDPOINT_PATH}`;

/**
 * Endpoint for closing a session. The access token stays valid until it
 * expires; only the refresh token is invalidated.
 */
export class LogoutApiEndpoint {
  /**
   * Invalidates the refresh token in the backend.
   * @param refreshToken - The refresh token of the current session.
   */
  async logout(refreshToken: string): Promise<void> {
    const request: LogoutRequest = { refreshToken };
    const response = await BaseApi.request(
      logoutApiUrl,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      },
      { authenticated: false },
    );
    if (!response.ok) {
      throw await toIamErrorFromResponse(response);
    }
  }
}
