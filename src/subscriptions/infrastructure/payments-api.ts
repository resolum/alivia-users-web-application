import { Preauthorization, type PaymentSetup } from '../domain/model/payment-authorization.ts';
import type {
  CreatePreauthorizationRequest,
  PaymentSetupResource,
  PreauthorizationResource,
} from './payment.resources.ts';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
const DRAFTS_PATH = `/${import.meta.env.VITE_CONFIGURATION_DRAFTS_ENDPOINT_PATH}`;

export class PaymentRequestError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'PaymentRequestError';
    this.status = status;
  }
}

function headers(idempotencyKey?: string): Headers {
  const value = new Headers({ 'Content-Type': 'application/json' });
  if (idempotencyKey !== undefined) value.set('Idempotency-Key', idempotencyKey);
  return value;
}

async function parse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const problem = await response.json().catch(() => null) as { detail?: string; title?: string } | null;
    throw new PaymentRequestError(
      response.status,
      problem?.detail ?? problem?.title ?? `No se pudo procesar el pago (${response.status}).`,
    );
  }
  return response.json() as Promise<T>;
}

function toPreauthorization(resource: PreauthorizationResource): Preauthorization {
  return new Preauthorization(resource);
}

export const paymentsApi = {
  async prepareSetup(draftId: string, idempotencyKey: string): Promise<PaymentSetup> {
    const response = await fetch(`${API_BASE_URL}${DRAFTS_PATH}/${encodeURIComponent(draftId)}/payment-setup`, {
      method: 'POST',
      headers: headers(idempotencyKey),
    });
    return parse<PaymentSetupResource>(response);
  },

  async createPreauthorization(
    draftId: string,
    idempotencyKey: string,
    request: CreatePreauthorizationRequest,
  ): Promise<Preauthorization> {
    const response = await fetch(`${API_BASE_URL}${DRAFTS_PATH}/${encodeURIComponent(draftId)}/preauthorization`, {
      method: 'POST',
      headers: headers(idempotencyKey),
      body: JSON.stringify(request),
    });
    return toPreauthorization(await parse<PreauthorizationResource>(response));
  },

  async getPreauthorization(draftId: string): Promise<Preauthorization> {
    const response = await fetch(
      `${API_BASE_URL}${DRAFTS_PATH}/${encodeURIComponent(draftId)}/preauthorization`,
      { method: 'GET', headers: headers() },
    );
    return toPreauthorization(await parse<PreauthorizationResource>(response));
  },
};
