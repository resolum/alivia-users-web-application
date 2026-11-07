import { Incident, type IncidentStage } from '../domain/model/incident.entity.ts';

/** Backend equivalent: SupportIncidentResource. */
export interface SupportIncidentResource {
  readonly id: number;
  readonly householdId: string;
  readonly deviceId: number;
  readonly reportedBy: number;
  readonly description: string;
  readonly severity: string;
  readonly status: string;
  readonly resolution: string | null;
  readonly evidences: readonly { readonly url: string; readonly publicId: string; readonly attachedAt: string }[];
  readonly statusHistory: readonly { readonly status: string; readonly changedAt: string }[];
  readonly visits: readonly {
    readonly orderId: number;
    readonly scheduledDate: string;
    readonly startTime: string;
    readonly endTime: string;
    readonly technicianId: number;
    readonly technicianName: string;
    readonly status: string;
  }[];
  readonly createdAt: string;
}

/** The backend has no endpoint for this action yet, or it needs data this app does not hold. */
export class IncidentActionUnavailableError extends Error {
  constructor() {
    super('incident_action_unavailable');
    this.name = 'IncidentActionUnavailableError';
  }
}

const STAGES: Readonly<Record<string, IncidentStage>> = {
  OPEN: 'registered',
  SCHEDULED: 'visit_scheduled',
  IN_PROGRESS: 'in_attention',
  RESOLVED: 'resolved',
};

const pad = (value: number) => String(value).padStart(4, '0');

export function toIncident(resource: SupportIncidentResource): Incident {
  const stageDates: Partial<Record<IncidentStage, string>> = {};
  for (const change of resource.statusHistory) {
    const stage = STAGES[change.status];
    if (stage) stageDates[stage] = change.changedAt;
  }
  stageDates.registered ??= resource.createdAt;
  const visit = resource.visits.at(-1);
  const stage = STAGES[resource.status] ?? 'registered';
  return new Incident({
    id: String(resource.id),
    code: `INC-${new Date(resource.createdAt).getFullYear()}-${pad(resource.id)}`,
    deviceId: String(resource.deviceId),
    // shortcut: the incident only carries the device id; name and room come once telemetry is connected.
    deviceName: `Dispositivo ${pad(resource.deviceId)}`,
    deviceCode: `DEV-${pad(resource.deviceId)}`,
    deviceKind: 'other',
    roomName: '',
    problemType: 'other',
    description: resource.description,
    reportedAt: resource.createdAt,
    stage,
    stageDates,
    visit: visit
      ? {
          start: `${visit.scheduledDate}T${visit.startTime}`,
          end: `${visit.scheduledDate}T${visit.endTime}`,
          technicianName: visit.technicianName,
          technicianSpecialty: '',
          rescheduleRequested: false,
        }
      : null,
    attentionNote: null,
    remoteNote: visit || stage === 'resolved' ? null : 'Sin visita programada',
    resolutionNote: resource.resolution || null,
    address: { line: '', district: '', reference: '' },
    evidence: resource.evidences.map((item, index) => ({
      name: item.publicId.split('/').at(-1) || `Evidencia ${index + 1}`,
      sizeLabel: '',
      url: item.url,
      stage: 'report' as const,
    })),
  });
}
