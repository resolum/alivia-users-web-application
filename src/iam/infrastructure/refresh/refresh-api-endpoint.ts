import { BaseApi } from '@/shared/infrastructure/base-api.ts';
import type { AuthTokens } from '@/shared/infrastructure/token-storage.ts';
import { toIamErrorFromResponse } from '../iam-error.mapper.ts';
import type { RefreshRequest } from './refresh.request.ts';
import type { RefreshResponse } from './refresh.response.ts';

const refreshApiUrl =
  `${import.meta.env.VITE_API_BASE_URL}/${import.meta.env.VITE_IAM_REFRESH_ENDPOINT_PATH}`;

/**
 * Endpoint for session refresh requests.
 */
export class RefreshApiEndpoint {
  /**
   * Exchanges a refresh token for a new access/refresh token pair.
   * @param refreshToken - The current refresh token.
   * @returns A promise resolving to the new token pair.
   */
  async refresh(refreshToken: string): Promise<AuthTokens> {
    const request: RefreshRequest = { refreshToken };
    const response = await BaseApi.request(
      refreshApiUrl,
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

    const data: RefreshResponse = await response.json();
    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken ?? refreshToken,
    };
  }
}
