import type { BaseEntity } from '@/shared/domain/model/base-entity.ts';

export const INCIDENT_STAGES = ['registered', 'evaluating', 'visit_scheduled', 'in_attention', 'resolved'] as const;
export type IncidentStage = (typeof INCIDENT_STAGES)[number];

export const PROBLEM_TYPES = ['battery', 'no_response', 'false_alarm', 'connectivity', 'physical_damage', 'other'] as const;
export type ProblemType = (typeof PROBLEM_TYPES)[number];

/** Kind of the affected device, copied from telemetry when the incident is reported. */
export type IncidentDeviceKind = 'microphone' | 'light' | 'window_sensor' | 'door_sensor' | 'other';

export interface IncidentEvidence {
  readonly name: string;
  readonly sizeLabel: string;
  /** Data URL of a photo attached in this browser, or null when only the name is known. */
  readonly url: string | null;
  readonly stage: 'report' | 'resolution';
}

export interface IncidentVisit {
  readonly start: string;
  readonly end: string;
  readonly technicianName: string;
  readonly technicianSpecialty: string;
  readonly rescheduleRequested: boolean;
}

export interface IncidentAddress {
  readonly line: string;
  readonly district: string;
  readonly reference: string;
}

export interface IncidentProps {
  readonly id: string;
  readonly code: string;
  readonly deviceId: string;
  readonly deviceName: string;
  readonly deviceCode: string;
  readonly deviceKind: IncidentDeviceKind;
  readonly roomName: string;
  readonly problemType: ProblemType;
  readonly description: string;
  readonly reportedAt: string;
  readonly stage: IncidentStage;
  /** When each reached stage started; later stages are absent. */
  readonly stageDates: Partial<Record<IncidentStage, string>>;
  readonly visit: IncidentVisit | null;
  readonly attentionNote: string | null;
  /** Shown while no visit is scheduled, e.g. "Diagnóstico remoto en curso". */
  readonly remoteNote: string | null;
  readonly resolutionNote: string | null;
  readonly address: IncidentAddress;
  readonly evidence: readonly IncidentEvidence[];
}

/** A support ticket about a home device. Backend equivalent: Incident (Soporte Técnico). */
export class Incident implements BaseEntity {
  readonly id: string;
  readonly code: string;
  readonly deviceId: string;
  readonly deviceName: string;
  readonly deviceCode: string;
  readonly deviceKind: IncidentDeviceKind;
  readonly roomName: string;
  readonly problemType: ProblemType;
  readonly description: string;
  readonly reportedAt: string;
  readonly stage: IncidentStage;
  readonly stageDates: Partial<Record<IncidentStage, string>>;
  readonly visit: IncidentVisit | null;
  readonly attentionNote: string | null;
  readonly remoteNote: string | null;
  readonly resolutionNote: string | null;
  readonly address: IncidentAddress;
  readonly evidence: readonly IncidentEvidence[];

  constructor(props: IncidentProps) {
    this.id = props.id;
    this.code = props.code;
    this.deviceId = props.deviceId;
    this.deviceName = props.deviceName;
    this.deviceCode = props.deviceCode;
    this.deviceKind = props.deviceKind;
    this.roomName = props.roomName;
    this.problemType = props.problemType;
    this.description = props.description;
    this.reportedAt = props.reportedAt;
    this.stage = props.stage;
    this.stageDates = props.stageDates;
    this.visit = props.visit;
    this.attentionNote = props.attentionNote;
    this.remoteNote = props.remoteNote;
    this.resolutionNote = props.resolutionNote;
    this.address = props.address;
    this.evidence = props.evidence;
  }

  get isResolved(): boolean {
    return this.stage === 'resolved';
  }

  get stageIndex(): number {
    return INCIDENT_STAGES.indexOf(this.stage);
  }

  /** A visit can be moved only before the technician starts working on it. */
  get canRescheduleVisit(): boolean {
    return this.stage === 'visit_scheduled' && this.visit !== null && !this.visit.rescheduleRequested;
  }
}
