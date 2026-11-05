import { describe, expect, it } from 'vitest';
import { RegisterAssistedPersonCommand } from '../../domain/model/register-assisted-person.command.ts';
import { toAssistedPersonRequest } from './assisted-person.request.ts';

const command = (changes: Partial<ConstructorParameters<typeof RegisterAssistedPersonCommand>[0]> = {}) =>
  new RegisterAssistedPersonCommand({
    firstName: 'Alberto',
    lastName: 'Villanueva',
    birthDate: '1942-05-14',
    documentType: 'DNI',
    documentNumber: '',
    kinship: 'SIBLING',
    phoneNumber: '',
    mobilityLevel: 'VERY_LIMITED',
    emergencyContactName: '',
    emergencyContactPhone: '',
    consent: true,
    ...changes,
  });

describe('toAssistedPersonRequest', () => {
  it('sends null for the empty optional fields and for a household kept in the browser', () => {
    expect(toAssistedPersonRequest('0b6c3f2e-local', command())).toEqual({
      householdId: null,
      firstName: 'Alberto',
      lastName: 'Villanueva',
      birthDate: '1942-05-14',
      documentType: null,
      documentNumber: null,
      kinship: 'SIBLING',
      phoneNumber: null,
      mobilityLevel: 'VERY_LIMITED',
      emergencyContactName: null,
      emergencyContactPhone: null,
      consentGiven: true,
    });
  });

  it('sends the numeric household, the document and the phones as E.164 digits', () => {
    const request = toAssistedPersonRequest(
      '42',
      command({
        documentType: 'CE',
        documentNumber: 'x01234567',
        phoneNumber: '912345678',
        emergencyContactName: 'Carlos Villanueva',
        emergencyContactPhone: '987654321',
      }),
    );
    expect(request).toMatchObject({
      householdId: 42,
      documentType: 'CE',
      documentNumber: 'X01234567',
      phoneNumber: '51912345678',
      emergencyContactName: 'Carlos Villanueva',
      emergencyContactPhone: '51987654321',
    });
  });
});
