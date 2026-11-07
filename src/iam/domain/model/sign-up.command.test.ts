import { describe, expect, it } from 'vitest';
import { SignUpCommand } from './sign-up.command.ts';

describe('SignUpCommand validations', () => {
  const validData = {
    firstName: 'Juan Carlos',
    lastName: 'Pérez Gómez',
    emailAddress: 'juan.perez@example.com',
    phoneNumber: '987654321',
    dni: '12345678',
    birthDate: '1990-01-01',
    password: 'Password123!',
    acceptedTerms: true,
  };

  it('accepts valid person names and 8-digit DNI', () => {
    const command = new SignUpCommand(validData);
    expect(command.validate()).toEqual({});
  });

  it('rejects DNI with fewer or more than 8 digits, or with letters', () => {
    const shortDni = new SignUpCommand({ ...validData, dni: '1234567' });
    expect(shortDni.validate().dni).toBe('invalid_dni');

    const longDni = new SignUpCommand({ ...validData, dni: '123456789' });
    expect(longDni.validate().dni).toBe('invalid_dni');

    const lettersDni = new SignUpCommand({ ...validData, dni: '1234567A' });
    expect(lettersDni.validate().dni).toBe('invalid_dni');
  });

  it('rejects first name with numbers or special characters', () => {
    const numberName = new SignUpCommand({ ...validData, firstName: 'Juan123' });
    expect(numberName.validate().firstName).toBe('invalid_name');

    const symbolName = new SignUpCommand({ ...validData, firstName: 'Juan@' });
    expect(symbolName.validate().firstName).toBe('invalid_name');
  });

  it('rejects last name with numbers or special characters', () => {
    const numberLast = new SignUpCommand({ ...validData, lastName: 'Pérez1' });
    expect(numberLast.validate().lastName).toBe('invalid_name');

    const symbolLast = new SignUpCommand({ ...validData, lastName: 'Pérez#' });
    expect(symbolLast.validate().lastName).toBe('invalid_name');
  });

  it('accepts names with accented characters, ñ, hyphens and apostrophes', () => {
    const command = new SignUpCommand({
      ...validData,
      firstName: 'María José',
      lastName: 'Nuñez-O\'Connor',
    });
    expect(command.validate()).toEqual({});
  });
});
