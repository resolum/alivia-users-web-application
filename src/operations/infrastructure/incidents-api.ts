import { LocalCollection, respond } from '@/shared/infrastructure/local-collection.ts';
import { Incident, type IncidentAddress, type IncidentDeviceKind, type IncidentProps } from '../domain/model/incident.entity.ts';
import type { ReportIncidentCommand } from '../domain/model/report-incident.command.ts';

export interface ReportedDevice {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly roomName: string;
  readonly kind: IncidentDeviceKind;
}

export interface IncidentsApi {
  readonly isSample: boolean;
  listIncidents(): Promise<Incident[]>;
  getIncident(id: string): Promise<Incident>;
  reportIncident(command: ReportIncidentCommand, device: ReportedDevice, address: IncidentAddress): Promise<Incident>;
  requestVisitReschedule(id: string): Promise<Incident>;
}

export class IncidentNotFoundError extends Error {
  constructor() {
    super('incident_not_found');
    this.name = 'IncidentNotFoundError';
  }
}

const ADDRESS: IncidentAddress = {
  line: 'Av. Del Parque Norte 742, Dpto 401',
  district: 'San Borja, Lima',
  reference: 'Frente al Parque Olímpico',
};
const TECHNICIAN = { technicianName: 'Santiago Vega', technicianSpecialty: 'Especialista en sensores y domótica asistiva' };

/** ISO of `days` ago at hh:mm local time. */
const at = (days: number, time: string) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  const [h, m] = time.split(':').map(Number);
  date.setHours(h, m, 0, 0);
  return date.toISOString();
};

const WINDOW_DEVICE = { deviceId: 'dev-0104', deviceName: 'Sensor de ventana', deviceCode: 'DEV-0104', deviceKind: 'window_sensor' as const, roomName: 'Dormitorio de Don Alberto' };

const incidents = new LocalCollection<IncidentProps>('alivia.operations.incidents', () => [
  {
    id: 'inc-0084', code: 'INC-2026-0084', ...WINDOW_DEVICE, problemType: 'battery',
    description: 'El sensor no detecta la apertura de la ventana desde anoche y la batería marca alerta baja recurrente. Se requiere revisión física y cambio de pila.',
    reportedAt: at(1, '09:30'), stage: 'visit_scheduled',
    stageDates: { registered: at(1, '09:30'), evaluating: at(1, '11:00'), visit_scheduled: at(1, '14:15') },
    visit: { start: at(-1, '10:30'), end: at(-1, '12:00'), ...TECHNICIAN, rescheduleRequested: false },
    attentionNote: null, remoteNote: null, resolutionNote: null, address: ADDRESS,
    evidence: [{ name: 'sensor_ventana_bateria.jpg', sizeLabel: '1.8 MB', url: null, stage: 'report' }],
  },
  {
    id: 'inc-0079', code: 'INC-2026-0079', deviceId: 'dev-0101', deviceName: 'Micrófono asistencial', deviceCode: 'DEV-0101', deviceKind: 'microphone', roomName: 'Sala principal',
    problemType: 'no_response', description: 'El micrófono no respondió a dos comandos de voz durante la noche.',
    reportedAt: at(2, '18:20'), stage: 'in_attention',
    stageDates: { registered: at(2, '18:20'), evaluating: at(2, '19:00'), in_attention: at(0, '08:10') },
    visit: null, attentionNote: 'El técnico revisa a distancia la sensibilidad y la conexión del micrófono.', remoteNote: 'Diagnóstico remoto en curso',
    resolutionNote: null, address: ADDRESS, evidence: [],
  },
  {
    id: 'inc-0075', code: 'INC-2026-0075', deviceId: 'dev-0202', deviceName: 'Luz inteligente', deviceCode: 'DEV-0202', deviceKind: 'light', roomName: 'Pasillo central',
    problemType: 'other', description: 'La luz se enciende sola de madrugada aunque nadie pasa por el pasillo.',
    reportedAt: at(4, '11:15'), stage: 'evaluating',
    stageDates: { registered: at(4, '11:15'), evaluating: at(3, '09:00') },
    visit: null, attentionNote: null, remoteNote: 'Sin visita programada', resolutionNote: null, address: ADDRESS, evidence: [],
  },
  {
    id: 'inc-0068', code: 'INC-2026-0068', ...WINDOW_DEVICE, problemType: 'battery',
    description: 'El sensor dejó de enviar el estado de la ventana y la batería marcaba alerta baja.',
    reportedAt: at(20, '09:30'), stage: 'resolved',
    stageDates: { registered: at(20, '09:30'), evaluating: at(20, '11:00'), visit_scheduled: at(20, '14:15'), in_attention: at(19, '10:42'), resolved: at(19, '11:48') },
    visit: { start: at(19, '10:30'), end: at(19, '12:00'), ...TECHNICIAN, rescheduleRequested: false },
    attentionNote: null, remoteNote: null, resolutionNote: 'Se reemplazó la batería y se verificó el funcionamiento del sensor.', address: ADDRESS,
    evidence: [
      { name: 'reporte_sensor.jpg', sizeLabel: '1.2 MB', url: null, stage: 'report' },
      { name: 'resolucion_sensor.jpg', sizeLabel: '1.4 MB', url: null, stage: 'resolution' },
    ],
  },
  {
    id: 'inc-0052', code: 'INC-2026-0052', deviceId: 'dev-0201', deviceName: 'Sensor de puerta principal', deviceCode: 'DEV-0201', deviceKind: 'door_sensor', roomName: 'Pasillo y acceso',
    problemType: 'false_alarm', description: 'Avisos de puerta abierta con la puerta cerrada.',
    reportedAt: at(41, '16:05'), stage: 'resolved',
    stageDates: { registered: at(41, '16:05'), evaluating: at(41, '17:00'), resolved: at(40, '10:20') },
    visit: null, attentionNote: null, remoteNote: null, resolutionNote: 'Se recalibró el sensor a distancia; no fue necesaria una visita.', address: ADDRESS, evidence: [],
  },
]);

function requireIncident(id: string): IncidentProps {
  const found = incidents.find(id);
  if (!found) throw new IncidentNotFoundError();
  return found;
}

function nextCode(): string {
  const year = new Date().getFullYear();
  const highest = incidents.all().reduce((max, item) => Math.max(max, Number(item.code.split('-').at(-1)) || 0), 0);
  return `INC-${year}-${String(highest + 1).padStart(4, '0')}`;
}

function sizeLabel(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/**
 * shortcut: the technical support contract is pending, so incidents live in
 * this browser with the Figma example data. Swap in the HTTP source here.
 */
const localIncidentsApi: IncidentsApi = {
  isSample: true,

  listIncidents: async () => (await respond(incidents.all())).map((props) => new Incident(props)),

  getIncident: async (id) => new Incident(await respond(requireIncident(id))),

  reportIncident: async (command, device, address) => {
    const now = new Date().toISOString();
    const saved = incidents.save({
      id: crypto.randomUUID(),
      code: nextCode(),
      deviceId: device.id,
      deviceName: device.name,
      deviceCode: device.code,
      deviceKind: device.kind,
      roomName: device.roomName,
      problemType: command.problemType || 'other',
      description: command.description,
      reportedAt: now,
      stage: 'registered',
      stageDates: { registered: now },
      visit: null,
      attentionNote: null,
      remoteNote: 'Sin visita programada',
      resolutionNote: null,
      address,
      evidence: command.photo
        ? [{ name: command.photo.name, sizeLabel: sizeLabel(command.photo.size), url: command.photo.dataUrl, stage: 'report' }]
        : [],
    });
    return new Incident(await respond(saved));
  },

  requestVisitReschedule: async (id) => {
    const current = requireIncident(id);
    if (!current.visit) throw new IncidentNotFoundError();
    const saved = incidents.save({ ...current, visit: { ...current.visit, rescheduleRequested: true } });
    return new Incident(await respond(saved));
  },
};

export function getIncidentsApi(): IncidentsApi {
  return localIncidentsApi;
}
