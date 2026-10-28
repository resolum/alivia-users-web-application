import type { HomeConfiguration, RoomConfiguration } from '../domain/model/home-configuration.ts';
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

export function getConfigurationDraftsApi(): ConfigurationDraftsApi {
  return httpApi;
}
