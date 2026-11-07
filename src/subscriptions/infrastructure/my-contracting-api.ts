import { BaseApi } from '@/shared/infrastructure/base-api.ts';
import { MyContracting, type MyContractingStage } from '../domain/model/my-contracting.ts';

interface MyContractingResource {
  readonly draftId: string;
  readonly stage: MyContractingStage;
  readonly active: boolean;
  readonly planCode: string;
  readonly billingCycle: string;
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
const DRAFTS_PATH = `/${import.meta.env.VITE_CONFIGURATION_DRAFTS_ENDPOINT_PATH}`;

function toEntity(resource: MyContractingResource): MyContracting {
  return new MyContracting(resource);
}

export class MyContractingRequestError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`My contracting request failed (${status})`);
    this.name = 'MyContractingRequestError';
    this.status = status;
  }
}

/** The signed-in family's request, read and linked with the session token. */
export const myContractingApi = {
  /** The account's latest request, or null when it has none. */
  async mine(): Promise<MyContracting | null> {
    const response = await BaseApi.request(`${API_BASE_URL}${DRAFTS_PATH}/mine`, { method: 'GET' }, { authenticated: true });
    if (response.status === 404) return null;
    if (!response.ok) throw new MyContractingRequestError(response.status);
    return toEntity((await response.json()) as MyContractingResource);
  },

  /** Links a request built before signing in to the account. */
  async claim(draftId: string): Promise<MyContracting> {
    const response = await BaseApi.request(
      `${API_BASE_URL}${DRAFTS_PATH}/${encodeURIComponent(draftId)}/owner`,
      { method: 'PUT' },
      { authenticated: true },
    );
    if (!response.ok) throw new MyContractingRequestError(response.status);
    return toEntity((await response.json()) as MyContractingResource);
  },
};
