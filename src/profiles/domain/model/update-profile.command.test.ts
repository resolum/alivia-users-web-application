import { describe, expect, it } from 'vitest';
import { UpdateProfileCommand } from './update-profile.command.ts';

describe('UpdateProfileCommand validations', () => {
  const validData = {
    firstName: 'María Elena',
    lastName: 'Villanueva Carrión',
    phoneNumber: '984123456',
  };

  it('accepts valid letters and spaces for names', () => {
    const command = new UpdateProfileCommand(validData);
    expect(command.validate()).toEqual({});
  });

  it('rejects names with numbers or special symbols', () => {
    const commandWithNumbers = new UpdateProfileCommand({
      ...validData,
      firstName: 'María12',
    });
    expect(commandWithNumbers.validate().firstName).toBe('invalid_name');

    const commandWithSymbols = new UpdateProfileCommand({
      ...validData,
      lastName: 'Villanueva$',
    });
    expect(commandWithSymbols.validate().lastName).toBe('invalid_name');
  });

  it('rejects names that are too short or required', () => {
    const emptyCommand = new UpdateProfileCommand({
      ...validData,
      firstName: '',
    });
    expect(emptyCommand.validate().firstName).toBe('required');

    const shortCommand = new UpdateProfileCommand({
      ...validData,
      lastName: 'A',
    });
    expect(shortCommand.validate().lastName).toBe('too_short');
  });
});
