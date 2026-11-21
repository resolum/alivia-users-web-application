import { BaseApi } from '@/shared/infrastructure/base-api.ts';
import { LocalCollection, respond } from '@/shared/infrastructure/local-collection.ts';
import { Household, type HouseholdProps } from '../domain/model/household.entity.ts';
import type { UpdateHouseholdCommand } from '../domain/model/update-household.command.ts';

export interface HouseholdMemberResource {
  readonly id: number;
  readonly userId: number;
  readonly responsibility: string;
  readonly status: string;
}

export interface HouseholdResource {
  readonly id: number;
  readonly alias: string;
  readonly formattedAddress: string | null;
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly placeId: string | null;
  readonly contactPhone: string | null;
  readonly contactEmail: string | null;
  readonly members?: readonly HouseholdMemberResource[];
  readonly responsibleAccountId?: number | null;
}

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

function formatPhone(phone: string | null): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('51') && digits.length === 11) {
    const local = digits.slice(2);
    return `+51 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
  }
  if (digits.length === 9) {
    return `+51 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  return phone;
}

function toHouseholdEntity(resource: HouseholdResource): Household {
  return new Household({
    id: String(resource.id),
    alias: resource.alias,
    phone: formatPhone(resource.contactPhone),
    email: resource.contactEmail ?? '',
    address: {
      line: resource.formattedAddress ?? '',
      district: '',
      city: 'Lima',
      reference: '',
      validated: Boolean(resource.placeId),
    },
    principalCaregiverName: '',
    assistedPersonName: '',
  });
}

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

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
const HOUSEHOLDS_PATH = import.meta.env.VITE_HOUSEHOLDS_ENDPOINT_PATH ?? 'households';
const householdsUrl = `${API_BASE_URL}/${HOUSEHOLDS_PATH.replace(/^\//, '')}`;

let isUsingBackend = false;

const httpHouseholdApi: HouseholdApi = {
  get isSample() {
    return !isUsingBackend && localHouseholdApi.isSample;
  },

  getHousehold: async (): Promise<Household> => {
    // 1. Try GET /api/v1/households/mine
    try {
      const response = await BaseApi.request(`${householdsUrl}/mine`, { method: 'GET' }, { authenticated: true });
      if (response.ok) {
        const resource: HouseholdResource = await response.json();
        isUsingBackend = true;
        return toHouseholdEntity(resource);
      }
    } catch {
      // Ignore network/auth error and try next
    }

    // 2. Try stored householdId if known
    const registered = readRegistered();
    if (registered && !Number.isNaN(Number(registered.id))) {
      try {
        const response = await BaseApi.request(
          `${householdsUrl}/${encodeURIComponent(registered.id)}`,
          { method: 'GET' },
          { authenticated: true },
        );
        if (response.ok) {
          const resource: HouseholdResource = await response.json();
          isUsingBackend = true;
          return toHouseholdEntity(resource);
        }
      } catch {
        // Fallback to local
      }
    }

    // 3. Fallback to local collection
    isUsingBackend = false;
    return localHouseholdApi.getHousehold();
  },

  updateHousehold: async (household: Household, command: UpdateHouseholdCommand): Promise<Household> => {
    if (!Number.isNaN(Number(household.id))) {
      const response = await BaseApi.request(
        `${householdsUrl}/${encodeURIComponent(household.id)}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            alias: command.alias,
            phoneNumber: command.localPhone,
            contactEmail: command.email,
          }),
        },
        { authenticated: true },
      );

      if (!response.ok) {
        throw new Error(`household_update_failed_${response.status}`);
      }

      const resource: HouseholdResource = await response.json();
      isUsingBackend = true;
      const updated = toHouseholdEntity(resource);
      localHouseholdApi.updateHousehold(household, command).catch(() => undefined);
      return updated;
    }

    return localHouseholdApi.updateHousehold(household, command);
  },
};

export function getHouseholdApi(): HouseholdApi {
  return httpHouseholdApi;
}
