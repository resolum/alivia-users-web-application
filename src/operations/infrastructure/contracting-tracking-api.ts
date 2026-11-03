import { ContractingTracking, type ContractingTrackingProps } from '../domain/model/contracting-tracking.ts';

export class TrackingRequestError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'TrackingRequestError';
    this.status = status;
  }
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
const DRAFTS_PATH = '/api/v1/configuration-drafts';

const MESSAGES: Readonly<Record<number, string>> = {
  404: 'No encontramos tu solicitud de contratación.',
  409: 'Aún no puedes confirmar: el técnico todavía no valida tu hogar.',
};

async function request(url: string, init?: RequestInit): Promise<ContractingTracking> {
  let response: Response;
  try {
    response = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } });
  } catch {
    throw new TrackingRequestError(0, 'No pudimos conectar con Alivia. Revisa tu conexión e inténtalo de nuevo.');
  }
  if (!response.ok) {
    throw new TrackingRequestError(response.status, MESSAGES[response.status] ?? 'No pudimos consultar el seguimiento.');
  }
  return new ContractingTracking(await response.json() as ContractingTrackingProps);
}

export const contractingTrackingApi = {
  get(draftId: string): Promise<ContractingTracking> {
    return request(`${API_BASE_URL}${DRAFTS_PATH}/${encodeURIComponent(draftId)}/tracking`);
  },

  /** The family confirms the configuration the technician validated; the request moves to installation. */
  confirm(draftId: string): Promise<ContractingTracking> {
    return request(`${API_BASE_URL}${DRAFTS_PATH}/${encodeURIComponent(draftId)}/confirmation`, { method: 'POST' });
  },
};
