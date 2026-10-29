import type { AuthTokens } from '@/shared/infrastructure/token-storage.ts';
import type { RefreshRequest } from './refresh.request.ts';
import type { RefreshResponse } from './refresh.response.ts';

export class RefreshAssembler {
  /**
   * Maps the current refresh token to a RefreshRequest for the API.
   */
  static toRequestFromToken(refreshToken: string): RefreshRequest {
    return { refreshToken };
  }

  /**
   * Maps a RefreshResponse to the new token pair. The sent refresh token is
   * kept only when the backend does not rotate it.
   */
  static toTokensFromResponse(response: RefreshResponse, refreshToken: string): AuthTokens {
    return {
      accessToken: response.accessToken,
      refreshToken: response.refreshToken ?? refreshToken,
    };
  }
}
