import { BaseApi } from '@/shared/infrastructure/base-api.ts';
import {
  Incident,
  type IncidentAddress,
  type IncidentDeviceKind,
  type IncidentEvidence,
  type IncidentStage,
  type IncidentVisit,
  type ProblemType,
} from '../domain/model/incident.entity.ts';
import type { ReportIncidentCommand, ReportPhoto } from '../domain/model/report-incident.command.ts';

/** Shapes of /api/v1/support-incidents, as the backend serializes them. */
interface StatusChangeDto {
  readonly status: string;
  readonly changedAt: string;
}

interface VisitDto {
  readonly orderId: number;
  readonly scheduledDate: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly technicianName: string | null;
  readonly status: string;
}

interface DeviceDto {
  readonly alias: string;
  readonly macAddress: string;
  readonly type: string;
}

export interface IncidentDto {
  readonly id: number;
  readonly deviceId: number;
  readonly description: string;
  readonly status: string;
  readonly resolution: string | null;
  readonly evidences: readonly { readonly url: string; readonly attachedAt: string }[];
  readonly statusHistory: readonly StatusChangeDto[];
  readonly visits: readonly VisitDto[];
  readonly createdAt: string;
  readonly code: string | null;
  readonly problemType: string | null;
  readonly occurredAt: string | null;
  readonly device: DeviceDto | null;
  readonly directions: string | null;
}

interface ReportableHomeDto {
  readonly directions: string | null;
  readonly devices: readonly (DeviceDto & { readonly id: number })[];
  readonly photoUploadEnabled?: boolean;
}

/** A device of the home that can be reported; its id is the MAC address the backend expects. */
export interface ReportableDevice {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly roomName: string;
  readonly kind: IncidentDeviceKind;
}

/** What the report form offers: the home's devices and whether a photo can be attached. */
export interface ReportForm {
  readonly devices: readonly ReportableDevice[];
  readonly photoUploadEnabled: boolean;
}

export class IncidentsRequestError extends Error {
  readonly status: number;
  /** The backend's problem code, such as slot_unavailable or incident_already_open. */
  readonly code: string | null;
  /** The open incident of the same device, when the backend rejects a duplicate report. */
  readonly incidentId: string | null;

  constructor(status: number, message: string, code: string | null = null, incidentId: string | null = null) {
    super(message);
    this.name = 'IncidentsRequestError';
    this.status = status;
    this.code = code;
    this.incidentId = incidentId;
  }
}

const CODE_MESSAGES: Readonly<Record<string, string>> = {
  slot_unavailable: 'Ese técnico ya no está libre en esa franja. Elige otro horario.',
  incident_already_open: 'Ya hay una incidencia abierta para este dispositivo.',
  incident_not_allowed: 'Tu hogar todavía no tiene el servicio activo para reportar incidencias.',
};

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
const INCIDENTS_PATH = '/api/v1/support-incidents';

const STAGE_OF: Readonly<Record<string, IncidentStage>> = {
  OPEN: 'registered',
  IN_EVALUATION: 'evaluating',
  SCHEDULED: 'visit_scheduled',
  IN_PROGRESS: 'in_attention',
  RESOLVED: 'resolved',
};

const DEVICE_TYPE_LABELS: Readonly<Record<string, string>> = {
  MICROPHONE: 'Micrófono',
  ACTUATOR: 'Actuador',
  SENSOR: 'Sensor',
  HUB: 'Hub',
};

/** Problem types travel as the backend enum names (BATTERY, NO_RESPONSE...). */
export const toBackendProblemType = (type: ProblemType) => type.toUpperCase();

function problemTypeOf(value: string | null): ProblemType {
  const type = value?.toLowerCase();
  return type === 'battery' || type === 'no_response' || type === 'false_alarm' || type === 'connectivity' || type === 'physical_damage'
    ? type
    : 'other';
}

export function deviceKindOf(device: Pick<DeviceDto, 'alias' | 'type'>): IncidentDeviceKind {
  switch (device.type) {
    case 'MICROPHONE':
      return 'microphone';
    case 'ACTUATOR':
      return 'light';
    case 'SENSOR':
      return /puerta|door/i.test(device.alias) ? 'door_sensor' : 'window_sensor';
    default:
      return 'other';
  }
}

const deviceCode = (position: number) => `DEV-${String(position).padStart(4, '0')}`;
const typeLabel = (type: string | undefined) => (type ? DEVICE_TYPE_LABELS[type] ?? 'Dispositivo' : 'Dispositivo');

/** "Av. Siempre Viva 742, Dpto 401, San Borja" → line and district, split at the last comma. */
export function addressOf(directions: string | null): IncidentAddress {
  const text = directions?.trim() ?? '';
  const cut = text.lastIndexOf(',');
  if (cut <= 0) return { line: text || 'Dirección registrada en la instalación', district: 'Lima', reference: '' };
  return { line: text.slice(0, cut).trim(), district: text.slice(cut + 1).trim(), reference: '' };
}

/** "2026-11-05" and "10:30:00" in the home's time zone (Lima, UTC-5) → ISO instant. */
const limaInstant = (date: string, time: string) => new Date(`${date}T${time.slice(0, 8).padEnd(8, ':00')}-05:00`).toISOString();

function visitOf(dto: IncidentDto): IncidentVisit | null {
  const visit = dto.visits.filter((item) => item.status !== 'CANCELLED').at(-1);
  if (!visit) return null;
  return {
    start: limaInstant(visit.scheduledDate, visit.startTime),
    end: limaInstant(visit.scheduledDate, visit.endTime),
    technicianName: visit.technicianName ?? 'Técnico Alivia',
    technicianSpecialty: 'Técnico de soporte Alivia',
    rescheduleRequested: false,
    reschedulable: false,
  };
}

function stageDatesOf(dto: IncidentDto): Partial<Record<IncidentStage, string>> {
  const dates: Partial<Record<IncidentStage, string>> = {};
  for (const change of dto.statusHistory) {
    const stage = STAGE_OF[change.status];
    if (stage && !dates[stage]) dates[stage] = change.changedAt;
  }
  return dates;
}

function evidenceOf(dto: IncidentDto): IncidentEvidence[] {
  const resolvedAt = dto.statusHistory.find((change) => change.status === 'RESOLVED')?.changedAt;
  return dto.evidences.map((evidence) => ({
    name: decodeURIComponent(evidence.url.split('/').at(-1) ?? 'evidencia'),
    sizeLabel: 'Foto',
    url: evidence.url,
    stage: resolvedAt && evidence.attachedAt >= resolvedAt ? 'resolution' : 'report',
  }));
}

const VISIT_DAY = new Intl.DateTimeFormat('es-PE', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Lima' });
const VISIT_TIME = new Intl.DateTimeFormat('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Lima' });

/** Before the technician confirms it, the visit the family chose is shown as requested. */
function remoteNoteOf(stage: IncidentStage, visit: IncidentVisit | null): string | null {
  if (visit === null) return 'Sin visita programada';
  if (stage !== 'registered' && stage !== 'evaluating') return null;
  const start = new Date(visit.start);
  return `Visita solicitada: ${VISIT_DAY.format(start)}, ${VISIT_TIME.format(start)} – ${VISIT_TIME.format(new Date(visit.end))} con ${visit.technicianName} (pendiente de confirmación)`;
}

/** Maps the backend incident to what the family follows, one stage per backend status. */
export function toIncident(dto: IncidentDto): Incident {
  const stage = STAGE_OF[dto.status] ?? 'registered';
  const stageDates = stageDatesOf(dto);
  const visit = visitOf(dto);
  return new Incident({
    id: String(dto.id),
    code: dto.code ?? `INC-${dto.id}`,
    deviceId: dto.device?.macAddress ?? String(dto.deviceId),
    deviceName: dto.device?.alias ?? `Dispositivo ${dto.deviceId}`,
    deviceCode: deviceCode(dto.deviceId),
    deviceKind: dto.device ? deviceKindOf(dto.device) : 'other',
    roomName: typeLabel(dto.device?.type),
    problemType: problemTypeOf(dto.problemType),
    description: dto.description,
    reportedAt: dto.occurredAt ?? stageDates.registered ?? dto.createdAt,
    stage,
    stageDates,
    visit,
    attentionNote: stage === 'in_attention' ? 'El técnico está revisando el dispositivo en tu hogar.' : null,
    remoteNote: remoteNoteOf(stage, visit),
    resolutionNote: dto.resolution,
    address: addressOf(dto.directions),
    evidence: evidenceOf(dto),
  });
}

/** "data:image/png;base64,..." → the image bytes, to send the photo as a file. */
export function photoBlob(photo: ReportPhoto): Blob {
  const base64 = photo.dataUrl.slice(photo.dataUrl.indexOf(',') + 1);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new Blob([bytes], { type: photo.type });
}

async function send(path: string, init: RequestInit = {}, json = true): Promise<Response> {
  let response: Response;
  try {
    response = await BaseApi.request(
      `${API_BASE_URL}${INCIDENTS_PATH}${path}`,
      json ? { ...init, headers: { 'Content-Type': 'application/json', ...init.headers } } : init,
      { authenticated: true },
    );
  } catch (error) {
    if (error instanceof Error && error.name === 'SessionExpiredError') throw error;
    throw new IncidentsRequestError(0, 'No pudimos conectar con Alivia. Revisa tu conexión e inténtalo de nuevo.');
  }
  if (!response.ok) {
    const problem = (await response.json().catch(() => null)) as { detail?: string; code?: string; incidentId?: number } | null;
    const code = problem?.code ?? null;
    throw new IncidentsRequestError(
      response.status,
      (code !== null ? CODE_MESSAGES[code] : undefined) ?? problem?.detail ?? 'No pudimos completar la solicitud.',
      code,
      problem?.incidentId == null ? null : String(problem.incidentId),
    );
  }
  return response;
}

export const incidentsHttpApi = {
  async list(): Promise<Incident[]> {
    const incidents = (await (await send('')).json()) as IncidentDto[];
    return incidents.map(toIncident).sort((a, b) => b.reportedAt.localeCompare(a.reportedAt));
  },

  async get(id: string): Promise<Incident> {
    return toIncident((await (await send(`/${encodeURIComponent(id)}`)).json()) as IncidentDto);
  },

  /** The installed devices of the family's active home (none until the installation is approved). */
  async reportForm(): Promise<ReportForm> {
    let response: Response;
    try {
      response = await send('/devices');
    } catch (error) {
      if (error instanceof IncidentsRequestError && error.status === 404) return { devices: [], photoUploadEnabled: false };
      throw error;
    }
    const home = (await response.json()) as ReportableHomeDto;
    return {
      photoUploadEnabled: home.photoUploadEnabled === true,
      devices: home.devices.map((device) => ({
        id: device.macAddress,
        code: deviceCode(device.id),
        name: device.alias,
        roomName: typeLabel(device.type),
        kind: deviceKindOf(device),
      })),
    };
  },

  /** Attaches the optional photo to a registered incident; 503 when photo storage is not configured. */
  async uploadPhoto(id: string, photo: ReportPhoto): Promise<Incident> {
    const body = new FormData();
    body.append('file', photoBlob(photo), photo.name);
    const response = await send(`/${encodeURIComponent(id)}/evidences/photo`, { method: 'POST', body }, false);
    return toIncident((await response.json()) as IncidentDto);
  },

  /** Registers the report; the backend puts it in evaluation and books the visit when a technician is free. */
  async report(command: ReportIncidentCommand): Promise<Incident> {
    if (command.problemType === '') throw new IncidentsRequestError(400, 'Elige el tipo de problema.');
    if (command.visit === null) throw new IncidentsRequestError(400, 'Elige el día, la franja y el técnico de la visita.');
    const response = await send('/reports', {
      method: 'POST',
      body: JSON.stringify({
        deviceMac: command.deviceId,
        problemType: toBackendProblemType(command.problemType),
        description: command.description,
        occurredAt: new Date().toISOString(),
        visitDate: command.visit.date,
        visitStartTime: command.visit.startTime,
        visitEndTime: command.visit.endTime,
        technicianId: command.visit.technicianId,
      }),
    });
    return toIncident((await response.json()) as IncidentDto);
  },
};
