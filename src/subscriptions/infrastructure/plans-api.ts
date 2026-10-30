import type { Plan } from '../domain/model/plan.entity.ts';
import { PlanAssembler } from './plan.assembler.ts';
import type { PlanResource } from './plan.resources.ts';

export interface PlansApi {
  getActivePlans(): Promise<readonly Plan[]>;
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
const PLANS_PATH = `/${import.meta.env.VITE_PLANS_ENDPOINT_PATH}`;

const httpPlansApi: PlansApi = {
  async getActivePlans() {
    const response = await fetch(`${API_BASE_URL}${PLANS_PATH}?status=ACTIVE`);
    if (!response.ok) throw new Error(`Unable to load plans (${response.status})`);
    const resources = (await response.json()) as PlanResource[];
    return resources.map(PlanAssembler.toEntity);
  },
};

export function getPlansApi(): PlansApi {
  return httpPlansApi;
}
