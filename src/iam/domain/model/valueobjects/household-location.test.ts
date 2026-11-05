import { describe, expect, it } from 'vitest';
import { toHouseholdAddressFields } from './household-location.ts';

const c = (longText: string, ...types: string[]) => ({ longText, types });

describe('toHouseholdAddressFields', () => {
  it('builds the street with its number, the district and the province as city', () => {
    const fields = toHouseholdAddressFields(
      [
        c('250', 'street_number'),
        c('Avenida El Derby', 'route'),
        c('El Derby', 'sublocality_level_1', 'sublocality', 'political'),
        c('Santiago de Surco', 'locality', 'political'),
        c('Provincia de Lima', 'administrative_area_level_2', 'political'),
        c('Municipalidad Metropolitana de Lima', 'administrative_area_level_1', 'political'),
        c('Perú', 'country', 'political'),
      ],
      'Av. El Derby 250, Santiago de Surco 15023, Perú',
    );
    expect(fields).toEqual({ address: 'Avenida El Derby 250', district: 'Santiago de Surco', city: 'Lima' });
  });

  it('falls back to the first line of the address when there is no street', () => {
    const fields = toHouseholdAddressFields(
      [c('Arequipa', 'locality'), c('Arequipa', 'administrative_area_level_2')],
      'Mz. B Lote 4, Arequipa, Perú',
    );
    expect(fields.address).toBe('Mz. B Lote 4');
    expect(fields.district).toBe('Arequipa');
  });
});
