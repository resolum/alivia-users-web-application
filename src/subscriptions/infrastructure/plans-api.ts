import type { Plan } from '../domain/model/plan.entity.ts';
import { PlanAssembler } from './plan.assembler.ts';
import type { PlanResource } from './plan.resources.ts';

export interface PlansApi {
  getActivePlans(): Promise<readonly Plan[]>;
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
const PLANS_PATH = import.meta.env.VITE_SUBSCRIPTIONS_PLANS_PATH ?? '/api/v1/plans';

const httpPlansApi: PlansApi = {
  async getActivePlans() {
    const response = await fetch(`${API_BASE_URL}${PLANS_PATH}?status=ACTIVE`);
    if (!response.ok) throw new Error(`Unable to load plans (${response.status})`);
    const resources = (await response.json()) as PlanResource[];
    return resources.map(PlanAssembler.toEntity);
  },
};

const MOCK_RESOURCES: readonly PlanResource[] = [
  {
    id: 1,
    code: 'MINIMUM',
    name: 'Plan Base',
    description: 'Ideal para iniciar la asistencia en el espacio principal del hogar.',
    status: 'ACTIVE',
    currency: 'PEN',
    billingPeriod: 'MONTHLY',
    basePriceAmount: 99,
    minimumMonthlyAmount: 99,
    priceQualifier: 'FIXED',
    additionalRoomMonthlyAmount: null,
    minimumRooms: 1,
    minActuators: 1,
    maxActuators: 1,
    includedActuators: 1,
    deviceMonthlyPrices: {},
    features: [
      '1 habitación incluida (Dormitorio principal)',
      '4 dispositivos (Hub, sensor, luz y micrófono SOS)',
      'App Alivia para cuidadores y familiares',
      'Monitoreo y asistencia local sin romper paredes',
      'Instalación sujeta a evaluación técnica sin costo',
    ],
    includedDevices: ['Hub', 'Sensor', 'Luz', 'Micrófono SOS'],
  },
  {
    id: 2,
    code: 'CUSTOM',
    name: 'Plan Personalizado',
    description: 'Configura múltiples habitaciones y dispositivos según se requiera.',
    status: 'ACTIVE',
    currency: 'PEN',
    billingPeriod: 'MONTHLY',
    basePriceAmount: 99,
    minimumMonthlyAmount: 149,
    priceQualifier: 'FROM',
    additionalRoomMonthlyAmount: 35,
    minimumRooms: 2,
    minActuators: 1,
    maxActuators: 4,
    includedActuators: 0,
    deviceMonthlyPrices: { LIGHT: 15, DOOR: 25, WINDOW: 15, CURTAIN: 15 },
    features: [
      '2 o más habitaciones (+ S/ 35/mes c/u)',
      'Dispositivos a medida (+ S/ 15 - S/ 25/mes c/u)',
      'Nombres personalizados por habitación para voz',
      'App con multicuidadores y alertas zonales',
      'Evaluación técnica presencial incluida sin recargo',
    ],
    includedDevices: [],
  },
];

const mockPlansApi: PlansApi = {
  async getActivePlans() {
    return MOCK_RESOURCES.map(PlanAssembler.toEntity);
  },
};

export function getPlansApi(): PlansApi {
  return import.meta.env.VITE_SUBSCRIPTIONS_MOCK === 'true' ? mockPlansApi : httpPlansApi;
}
