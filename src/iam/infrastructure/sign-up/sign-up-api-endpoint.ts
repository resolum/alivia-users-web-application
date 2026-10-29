import { BaseApi } from '@/shared/infrastructure/base-api.ts';
import type { Account } from '../../domain/model/account.entity.ts';
import type { SignUpCommand } from '../../domain/model/sign-up.command.ts';
import { toIamErrorFromResponse } from '../iam-error.mapper.ts';
import { SignUpAssembler } from './sign-up.assembler.ts';
import type { SignUpResponse } from './sign-up.response.ts';

const signUpApiUrl =
  `${import.meta.env.VITE_API_BASE_URL}/${import.meta.env.VITE_IAM_SIGN_UP_ENDPOINT_PATH}`;

/**
 * Endpoint for registering the responsible client.
 */
export class SignUpApiEndpoint {
  /**
   * Creates an account pending verification. The backend sends the
   * verification link to the registered email.
   * @param command - The sign-up command.
   * @returns A promise resolving to the registered account.
   */
  async signUp(command: SignUpCommand): Promise<Account> {
    const request = SignUpAssembler.toRequestFromCommand(command);
    const response = await BaseApi.request(
      signUpApiUrl,
      { method: 'POST', body: SignUpAssembler.toFormDataFromRequest(request) },
      { authenticated: false },
    );
    if (!response.ok) {
      throw await toIamErrorFromResponse(response, 'validation_failed');
    }

    const data: SignUpResponse = await response.json();
    return SignUpAssembler.toEntityFromResponse(data);
  }
}
