import { describe, expect, it } from 'vitest';
import {
  RegisterAssistedPersonCommand,
  type AssistedPersonRegistrationValues,
} from './register-assisted-person.command.ts';

const NOW = new Date('2026-11-05T12:00:00');

const base: AssistedPersonRegistrationValues = {
  firstName: ' Alberto ',
  lastName: 'Villanueva Carrión',
  birthDate: '1942-05-14',
  documentType: 'DNI',
  documentNumber: '',
  kinship: 'PARENT',
  phoneNumber: '',
  mobilityLevel: 'PARTIAL',
  emergencyContactName: '',
  emergencyContactPhone: '',
  consent: true,
};

const errorsOf = (changes: Partial<AssistedPersonRegistrationValues>) =>
  new RegisterAssistedPersonCommand({ ...base, ...changes }).validate(NOW);

describe('RegisterAssistedPersonCommand', () => {
  it('accepts the required data and leaves the optional fields empty', () => {
    const command = new RegisterAssistedPersonCommand(base);
    expect(command.validate(NOW)).toEqual({});
    expect(command.values.firstName).toBe('Alberto');
    expect(command.phoneNumber).toBeNull();
    expect(command.hasEmergencyContact).toBe(false);
  });

  it('asks for the names, birth date, kinship, accessibility profile and consent', () => {
    expect(
      errorsOf({
        firstName: '',
        lastName: ' ',
        birthDate: '',
        kinship: '',
        mobilityLevel: '',
        consent: false,
      }),
    ).toEqual({
      firstName: 'required',
      lastName: 'required',
      birthDate: 'required',
      kinship: 'required',
      mobilityLevel: 'required',
      consent: 'required',
    });
  });

  it('rejects a future birth date', () => {
    expect(errorsOf({ birthDate: '2027-01-01' })).toEqual({ birthDate: 'invalid_date' });
  });

  it('checks the document only when one is given', () => {
    expect(errorsOf({ documentNumber: '1234' })).toEqual({ documentNumber: 'invalid_dni' });
    expect(errorsOf({ documentNumber: '08472910' })).toEqual({});
    expect(errorsOf({ documentType: 'PASSPORT', documentNumber: 'ab12' })).toEqual({ documentNumber: 'invalid' });
    expect(errorsOf({ documentType: 'CE', documentNumber: '00123456' })).toEqual({ documentNumber: 'invalid' });
    expect(errorsOf({ documentType: 'CE', documentNumber: '001234567' })).toEqual({});
    expect(errorsOf({ documentType: 'PASSPORT', documentNumber: 'AB1234' })).toEqual({});
  });

  it('normalizes the optional phone to E.164 digits', () => {
    expect(errorsOf({ phoneNumber: '812345678' })).toEqual({ phoneNumber: 'invalid_phone' });
    expect(new RegisterAssistedPersonCommand({ ...base, phoneNumber: '912345678' }).phoneNumber).toBe('51912345678');
  });

  it('asks for both parts of the emergency contact once one is filled', () => {
    expect(errorsOf({ emergencyContactName: 'Carlos Villanueva' })).toEqual({ emergencyContactPhone: 'required' });
    expect(errorsOf({ emergencyContactPhone: '987654321' })).toEqual({ emergencyContactName: 'required' });
    const command = new RegisterAssistedPersonCommand({
      ...base,
      emergencyContactName: 'Carlos Villanueva',
      emergencyContactPhone: '987654321',
    });
    expect(command.validate(NOW)).toEqual({});
    expect(command.emergencyContactPhone).toBe('51987654321');
  });

  it('never prints the document number', () => {
    const command = new RegisterAssistedPersonCommand({ ...base, documentNumber: '08472910' });
    expect(String(command)).not.toContain('08472910');
  });
});
