import { afterEach, describe, expect, it, vi } from 'vitest';
import { getHouseholdApi } from './household-api.ts';
import { UpdateHouseholdCommand } from '../domain/model/update-household.command.ts';

const SAMPLE_HOUSEHOLD_RESOURCE = {
  id: 1,
  alias: 'Hogar Don Alberto',
  formattedAddress: 'Av. Del Parque Norte 742, San Borja, Lima',
  latitude: -12.046374,
  longitude: -77.042793,
  placeId: 'place-1',
  contactPhone: '51984123456',
  contactEmail: 'familia@alivia.pe',
  members: [
    {
      id: 10,
      userId: 100,
      responsibility: 'PRINCIPAL',
      status: 'ACTIVE',
    },
  ],
  responsibleAccountId: 100,
};

describe('httpHouseholdApi', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads the active household from the backend', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(SAMPLE_HOUSEHOLD_RESOURCE), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const api = getHouseholdApi();
    const household = await api.getHousehold();

    expect(household.id).toBe('1');
    expect(household.alias).toBe('Hogar Don Alberto');
    expect(household.phone).toBe('+51 984 123 456');
    expect(household.email).toBe('familia@alivia.pe');
    expect(household.address.line).toBe('Av. Del Parque Norte 742, San Borja, Lima');
    expect(household.address.validated).toBe(true);
    expect(api.isSample).toBe(false);
  });

  it('updates the household through PUT on backend', async () => {
    const updatedResource = {
      ...SAMPLE_HOUSEHOLD_RESOURCE,
      alias: 'Hogar Actualizado',
      contactPhone: '51999888777',
      contactEmail: 'actualizado@alivia.pe',
    };

    const fetchMock = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (init?.method === 'PUT') {
        return Promise.resolve(new Response(JSON.stringify(updatedResource), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify(SAMPLE_HOUSEHOLD_RESOURCE), { status: 200 }));
    });
    vi.stubGlobal('fetch', fetchMock);

    const api = getHouseholdApi();
    const current = await api.getHousehold();
    const command = new UpdateHouseholdCommand('Hogar Actualizado', '999 888 777', 'actualizado@alivia.pe');

    const updated = await api.updateHousehold(current, command);

    expect(updated.id).toBe('1');
    expect(updated.alias).toBe('Hogar Actualizado');
    expect(updated.phone).toBe('+51 999 888 777');
    expect(updated.email).toBe('actualizado@alivia.pe');
  });
});
