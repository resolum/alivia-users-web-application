import { LocalCollection, respond } from '@/shared/infrastructure/local-collection.ts';
import { Household, type HouseholdProps } from '../domain/model/household.entity.ts';
import type { UpdateHouseholdCommand } from '../domain/model/update-household.command.ts';

export interface HouseholdApi {
  readonly isSample: boolean;
  getHousehold(): Promise<Household>;
  updateHousehold(household: Household, command: UpdateHouseholdCommand): Promise<Household>;
}

/** Written by the IAM registration fallback when the household was created in this browser. */
const REGISTERED_HOUSEHOLD_KEY = 'alivia.iam.household-account';

interface RegisteredHousehold {
  readonly id: string;
  readonly alias: string;
  readonly phoneNumber: string;
  readonly contactEmail: string;
  readonly address: string;
  readonly district: string;
  readonly city: string;
}

function readRegistered(): RegisteredHousehold | null {
  try {
    const raw = window.localStorage.getItem(REGISTERED_HOUSEHOLD_KEY);
    return raw ? (JSON.parse(raw) as RegisteredHousehold) : null;
  } catch {
    return null;
  }
}

const households = new LocalCollection<HouseholdProps>('alivia.profiles.household', () => {
  const registered = readRegistered();
  if (registered) {
    return [
      {
        id: registered.id,
        alias: registered.alias,
        phone: registered.phoneNumber,
        email: registered.contactEmail,
        address: { line: registered.address, district: registered.district, city: registered.city, reference: '', validated: false },
        principalCaregiverName: '',
        assistedPersonName: '',
      },
    ];
  }
  return [
    {
      id: 'household-sample',
      alias: 'Hogar Don Alberto',
      phone: '+51 984 123 456',
      email: 'familia.villanueva@alivia.pe',
      address: {
        line: 'Av. Del Parque Norte 742, Dpto 401',
        district: 'San Borja',
        city: 'Lima',
        reference: 'A espaldas de la Clínica San Borja, frente al Parque Olímpico (timbre 401).',
        validated: true,
      },
      principalCaregiverName: 'María Elena Villanueva',
      assistedPersonName: 'Alberto Villanueva C.',
    },
  ];
});

/**
 * shortcut: the backend has no household read/update endpoint yet; the data
 * comes from the registration kept in this browser, or the Figma example.
 */
const localHouseholdApi: HouseholdApi = {
  isSample: readRegistered() === null,

  getHousehold: async () => {
    const [current] = households.all();
    return new Household(await respond(current));
  },

  updateHousehold: async (household, command) => {
    const saved = households.save({
      ...household,
      alias: command.alias,
      phone: command.internationalPhone,
      email: command.email,
    });
    return new Household(await respond(saved));
  },
};

export function getHouseholdApi(): HouseholdApi {
  return localHouseholdApi;
}
