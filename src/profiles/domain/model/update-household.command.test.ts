import { describe, expect, it } from 'vitest';
import { toLocalPhone, UpdateHouseholdCommand } from './update-household.command.ts';

describe('UpdateHouseholdCommand', () => {
  it('normalises the phone to the international format', () => {
    const command = new UpdateHouseholdCommand('Hogar Don Alberto', '984 123 456', 'Familia@Alivia.pe');
    expect(command.validate()).toEqual({});
    expect(command.internationalPhone).toBe('+51 984 123 456');
    expect(command.email).toBe('familia@alivia.pe');
    expect(toLocalPhone('+51 984 123 456')).toBe('984 123 456');
  });

  it('reports each invalid field', () => {
    expect(new UpdateHouseholdCommand('x'.repeat(51), '12345', 'nope').validate()).toEqual({
      alias: 'too_long',
      phone: 'invalid_phone',
      email: 'invalid_email',
    });
  });
});
