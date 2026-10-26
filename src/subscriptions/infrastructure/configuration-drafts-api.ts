import { createDefaultConfiguration, HomeConfiguration, type RoomConfiguration } from '../domain/model/home-configuration.ts';
import type { BillingPeriod, PlanCode } from '../domain/model/plan.entity.ts';
import { ConfigurationDraftAssembler } from './configuration-draft.assembler.ts';
import type { ConfigurationDraftResource } from './configuration-draft.resources.ts';

export interface ConfigurationDraftsApi {
  createDraft(planCode: PlanCode, billingPeriod: BillingPeriod): Promise<HomeConfiguration>;
  getDraft(id: string): Promise<HomeConfiguration>;
  replaceRooms(id: string, rooms: readonly RoomConfiguration[]): Promise<HomeConfiguration>;
}

export class ConfigurationDraftRequestError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ConfigurationDraftRequestError';
    this.status = status;
  }
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
const DRAFTS_PATH = import.meta.env.VITE_SUBSCRIPTIONS_DRAFTS_PATH ?? '/api/v1/configuration-drafts';

async function request(url: string, init?: RequestInit): Promise<HomeConfiguration> {
  const response = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!response.ok) {
    const problem = await response.json().catch(() => null) as { detail?: string } | null;
    throw new ConfigurationDraftRequestError(
      response.status,
      problem?.detail ?? `Configuration request failed (${response.status})`,
    );
  }
  return ConfigurationDraftAssembler.toEntity(await response.json() as ConfigurationDraftResource);
}

const httpApi: ConfigurationDraftsApi = {
  createDraft: (planCode, billingPeriod) => request(`${API_BASE_URL}${DRAFTS_PATH}`, {
    method: 'POST',
    body: JSON.stringify({ planCode, billingCycle: billingPeriod }),
  }),
  getDraft: (id) => request(`${API_BASE_URL}${DRAFTS_PATH}/${encodeURIComponent(id)}`),
  replaceRooms: (id, rooms) => request(`${API_BASE_URL}${DRAFTS_PATH}/${encodeURIComponent(id)}/rooms`, {
    method: 'PUT',
    body: JSON.stringify({ rooms: rooms.map(ConfigurationDraftAssembler.toRoomResource) }),
  }),
};

const mockDrafts = new Map<string, HomeConfiguration>();
const MOCK_STORAGE_PREFIX = 'alivia.mock-configuration-draft.';

function saveMock(draft: HomeConfiguration): HomeConfiguration {
  mockDrafts.set(draft.draftId, draft);
  window.sessionStorage.setItem(`${MOCK_STORAGE_PREFIX}${draft.draftId}`, JSON.stringify(draft));
  return draft;
}

function readMock(id: string): HomeConfiguration | undefined {
  const memoryDraft = mockDrafts.get(id);
  if (memoryDraft !== undefined) return memoryDraft;
  const stored = window.sessionStorage.getItem(`${MOCK_STORAGE_PREFIX}${id}`);
  if (stored === null) return undefined;
  try {
    const draft = new HomeConfiguration(JSON.parse(stored) as ConstructorParameters<typeof HomeConfiguration>[0]);
    mockDrafts.set(id, draft);
    return draft;
  } catch {
    window.sessionStorage.removeItem(`${MOCK_STORAGE_PREFIX}${id}`);
    return undefined;
  }
}

function quote(configuration: HomeConfiguration): HomeConfiguration {
  const actuators = configuration.rooms.reduce(
    (sum, room) => sum + room.devices.LIGHT + room.devices.DOOR + room.devices.WINDOW + room.devices.CURTAIN,
    0,
  );
  const base = configuration.planCode === 'MINIMUM' ? 99 : 149;
  const additionalRooms = configuration.planCode === 'CUSTOM' ? Math.max(0, configuration.rooms.length - 2) * 35 : 0;
  const deviceAmount = configuration.planCode === 'CUSTOM'
    ? configuration.rooms.reduce(
        (sum, room) => sum + room.devices.LIGHT * 15 + room.devices.DOOR * 25
          + room.devices.WINDOW * 25 + room.devices.CURTAIN * 20,
        0,
      )
    : 0;
  return new HomeConfiguration({
    ...configuration,
    quote: actuators === 0 ? null : {
      currency: 'PEN', rooms: configuration.rooms.length, baseMonthlyAmount: base,
      additionalRoomsMonthlyAmount: additionalRooms, devicesMonthlyAmount: deviceAmount,
      totalMonthlyAmount: base + additionalRooms + deviceAmount,
    },
    updatedAt: new Date().toISOString(),
  });
}

const mockApi: ConfigurationDraftsApi = {
  async createDraft(planCode, billingPeriod) {
    const id = crypto.randomUUID();
    const draft = quote(createDefaultConfiguration(id, planCode, billingPeriod));
    return saveMock(draft);
  },
  async getDraft(id) {
    const draft = readMock(id);
    if (draft === undefined) throw new ConfigurationDraftRequestError(404, 'No existe el borrador de configuración.');
    return draft;
  },
  async replaceRooms(id, rooms) {
    const current = readMock(id);
    if (current === undefined) throw new ConfigurationDraftRequestError(404, 'No existe el borrador de configuración.');
    const next = quote(new HomeConfiguration({ ...current, rooms }));
    return saveMock(next);
  },
};

export function getConfigurationDraftsApi(): ConfigurationDraftsApi {
  return import.meta.env.VITE_SUBSCRIPTIONS_MOCK === 'true' ? mockApi : httpApi;
}
