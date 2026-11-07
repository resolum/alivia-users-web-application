import { describe, expect, it } from 'vitest';
import { CreateHouseholdAccountCommand } from './create-household-account.command.ts';

const base = {
  responsibleAccountId: '7',
  alias: 'Casa',
  phoneNumber: '987654321',
  contactEmail: 'familia@correo.pe',
  address: 'Avenida El Derby 250',
  district: 'Santiago de Surco',
  city: 'Lima',
};
const location = {
  latitude: -12.109722,
  longitude: -76.974444,
  placeId: 'ChIJw8gA1j_JBZERSF7Yf_Q8lJc',
  formattedAddress: 'Av. El Derby 250, Santiago de Surco, Perú',
};

describe('CreateHouseholdAccountCommand location', () => {
  it('asks for the map point when the map is available', () => {
    const command = new CreateHouseholdAccountCommand({ ...base, locationRequired: true });
    expect(command.validate()).toEqual({ location: 'required' });
  });

  it('accepts the typed address alone when there is no map', () => {
    expect(new CreateHouseholdAccountCommand(base).validate()).toEqual({});
  });

  it('keeps the picked point', () => {
    const command = new CreateHouseholdAccountCommand({ ...base, location, locationRequired: true });
    expect(command.validate()).toEqual({});
    expect(command.location).toEqual(location);
  });
});
