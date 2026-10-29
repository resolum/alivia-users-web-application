import { BaseApi } from '@/shared/infrastructure/base-api.ts';
import type { AuthSession } from '../../domain/model/auth-session.ts';
import type { SignInCommand } from '../../domain/model/sign-in.command.ts';
import { toIamErrorFromResponse } from '../iam-error.mapper.ts';
import { SignInAssembler } from './sign-in.assembler.ts';
import type { SignInResponse } from './sign-in.response.ts';

const signInApiUrl =
  `${import.meta.env.VITE_API_BASE_URL}/${import.meta.env.VITE_IAM_SIGN_IN_ENDPOINT_PATH}`;

/**
 * Endpoint for IAM sign-in requests.
 */
export class SignInApiEndpoint {
  /**
   * Authenticates a user with the given credentials.
   * @param command - The sign-in command containing email and password.
   * @returns A promise resolving to the authenticated session.
   */
  async signIn(command: SignInCommand): Promise<AuthSession> {
    const response = await BaseApi.request(
      signInApiUrl,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(SignInAssembler.toRequestFromCommand(command)),
      },
      { authenticated: false },
    );
    if (!response.ok) {
      throw await toIamErrorFromResponse(response, 'invalid_credentials');
    }

    const data: SignInResponse = await response.json();
    return SignInAssembler.toSessionFromResponse(data);
  }
}
