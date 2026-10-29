import { Account } from '../../domain/model/account.entity.ts';
import type { SignUpCommand } from '../../domain/model/sign-up.command.ts';
import type { SignUpRequest } from './sign-up.request.ts';
import type { SignUpResponse } from './sign-up.response.ts';

/** Access role of the responsible client (FAMILIAR in the backend parser). */
const RESPONSIBLE_ROLE = 'CAREGIVER';

export class SignUpAssembler {
  /**
   * Maps a SignUpCommand to a SignUpRequest for the API.
   */
  static toRequestFromCommand(command: SignUpCommand): SignUpRequest {
    return {
      firstName: command.firstName,
      lastName: command.lastName,
      email: command.emailAddress.toLowerCase(),
      phoneNumber: command.phoneNumber,
      password: command.password,
      acceptedTerms: String(command.acceptedTerms),
      role: RESPONSIBLE_ROLE,
      dni: command.dni,
      birthDate: command.birthDate,
    };
  }

  /**
   * Maps a SignUpRequest to the multipart body the backend reads. The browser
   * sets the boundary header.
   */
  static toFormDataFromRequest(request: SignUpRequest): FormData {
    const form = new FormData();
    for (const [field, value] of Object.entries(request)) {
      form.append(field, value);
    }
    return form;
  }

  /**
   * Maps a SignUpResponse to an Account domain entity.
   */
  static toEntityFromResponse(response: SignUpResponse): Account {
    return new Account({
      accountId: response.accountId,
      status: response.status,
      maskedEmail: response.maskedEmail,
    });
  }
}
