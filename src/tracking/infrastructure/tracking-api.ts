import { BaseApi } from '@/shared/infrastructure/base-api.ts';
import { LocalCollection, respond } from '@/shared/infrastructure/local-collection.ts';
import { Device, NEVER_SYNCED, type DeviceKind, type HomeEdge, type DeviceProps, type HomeDevices, type Room } from '../domain/model/device.entity.ts';

export interface TrackingApi {
  readonly isSample: boolean;
  getHomeDevices(): Promise<HomeDevices>;
}

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();
const atToday = (time: string, daysBack = 0) => {
  const date = new Date();
  date.setDate(date.getDate() - daysBack);
  const [h, m] = time.split(':').map(Number);
  date.setHours(h, m, 0, 0);
  return date.toISOString();
};

const ROOMS: readonly Room[] = [
  { id: 'room-main', name: 'Dormitorio de Don Alberto', description: 'Zona de descanso principal' },
  { id: 'room-hall', name: 'Pasillo y acceso', description: 'Acceso perimétrico y tránsito continuo' },
];

const MAIN = { roomId: 'room-main', roomName: 'Dormitorio de Don Alberto', technicianName: 'Santiago Vega (Técnico Alivia Lima)', connectivity: 'Hub Alivia, enlace directo' };
const HALL = { roomId: 'room-hall', roomName: 'Pasillo y acceso', technicianName: 'Santiago Vega (Técnico Alivia Lima)', connectivity: 'Hub Alivia, enlace directo' };

const devices = new LocalCollection<DeviceProps>('alivia.tracking.devices', () => [
  {
    id: 'dev-0101', code: 'DEV-0101', name: 'Micrófono asistencial SOS', description: 'Reconocimiento de voz SOS', kind: 'microphone',
    placement: 'Cabecera', power: { type: 'wired' }, online: true, stateLabel: 'En escucha activa de seguridad', lastSyncAt: minutesAgo(1), ...MAIN,
    history: [{ at: minutesAgo(1), title: 'Escucha activa', detail: 'Autodiagnóstico correcto.', tone: 'ok' }],
  },
  {
    id: 'dev-0102', code: 'DEV-0102', name: 'Control de luz adaptativa', description: 'Iluminación inteligente adaptativa', kind: 'light',
    placement: 'Techo', power: { type: 'wired' }, online: true, stateLabel: 'Apagado programado (modo noche)', lastSyncAt: minutesAgo(5), ...MAIN,
    history: [{ at: minutesAgo(5), title: 'Modo noche', detail: 'Apagado según la rutina programada.', tone: 'info' }],
  },
  {
    id: 'dev-0104', code: 'DEV-0104', name: 'Sensor de ventana', description: 'Sensor magnético de apertura', kind: 'window_sensor',
    placement: 'Ventana Este', power: { type: 'battery', level: 18, cell: 'Pila CR2032' }, online: true, stateLabel: 'Ventana cerrada', lastSyncAt: minutesAgo(12), ...MAIN,
    history: [
      { at: atToday('10:30'), title: 'Ventana cerrada', detail: 'Verificación rutinaria completada con normalidad.', tone: 'ok' },
      { at: atToday('08:15'), title: 'Ventana abierta', detail: 'Ventilación matutina registrada.', tone: 'info' },
      { at: atToday('21:30', 1), title: 'Aviso preventivo', detail: 'La batería descendió del 20 %.', tone: 'warning' },
    ],
  },
  {
    id: 'dev-0201', code: 'DEV-0201', name: 'Sensor de puerta principal', description: 'Sensor magnético de apertura', kind: 'door_sensor',
    placement: 'Puerta de entrada', power: { type: 'battery', level: 84, cell: 'Pila CR2032' }, online: true, stateLabel: 'Puerta cerrada', lastSyncAt: minutesAgo(2), ...HALL,
    history: [{ at: minutesAgo(2), title: 'Puerta cerrada', detail: 'Sin aperturas en la última hora.', tone: 'ok' }],
  },
  {
    id: 'dev-0202', code: 'DEV-0202', name: 'Luz guía de pasadizo', description: 'Iluminación inteligente adaptativa', kind: 'light',
    placement: null, power: { type: 'wired' }, online: true, stateLabel: 'Modo adaptativo activo', lastSyncAt: minutesAgo(8), ...HALL,
    history: [{ at: minutesAgo(8), title: 'Modo adaptativo', detail: 'Se enciende al detectar paso nocturno.', tone: 'info' }],
  },
]);

/** Example devices from the Figma design, used when the backend is not configured or cannot be reached. */
const localTrackingApi: TrackingApi = {
  isSample: true,
  getHomeDevices: async () => {
    const list = await respond(devices.all());
    // shortcut: the hub heartbeat is not modelled yet; the newest device sync stands in for it.
    const newest = list.map((props) => props.lastSyncAt).sort((a, b) => a.localeCompare(b)).at(-1) ?? new Date(0).toISOString();
    return { rooms: ROOMS, devices: list.map((props) => new Device(props)), hubOnline: list.some((props) => props.online), hubLastContactAt: newest };
  },
};

/** One device of `GET /assisted-persons/{id}/devices/status`. */
export interface HomeDeviceStatusResource {
  readonly deviceId: number;
  readonly alias: string;
  readonly type: string;
  readonly roomKey: string;
  readonly connectionStatus: 'CONNECTED' | 'DISCONNECTED' | 'UNKNOWN';
  readonly operationalStatus?: 'OK' | 'DEGRADED' | 'FAILED';
  readonly currentState?: string;
  readonly batteryPct?: number;
  readonly lastCommunicationAt?: string;
  readonly lastUpdatedAt?: string;
  readonly faults?: readonly string[];
  readonly stale: boolean;
}

export interface HomeEdgeStatusResource {
  readonly edgeId: number;
  readonly kind: 'MICROPHONE' | 'ACTUATOR';
  readonly link: 'ONLINE' | 'OFFLINE' | 'UNKNOWN';
  readonly lastReportAt?: string;
}

export interface HomeStatusResource {
  readonly householdId: number;
  readonly edgeLink: 'ONLINE' | 'OFFLINE' | 'UNKNOWN';
  readonly lastUpdatedAt?: string;
  readonly devices: readonly HomeDeviceStatusResource[];
  readonly edges?: readonly HomeEdgeStatusResource[];
}

function toHomeEdge(edge: HomeEdgeStatusResource): HomeEdge {
  const voice = edge.kind === 'MICROPHONE';
  return {
    id: String(edge.edgeId),
    kind: voice ? 'voice' : 'actuators',
    name: voice ? 'Edge de control por voz' : 'Edge de actuadores',
    description: voice ? 'Escucha los micrófonos y entiende los comandos de voz' : 'Mueve la puerta, la ventana, la cortina y la luz',
    link: edge.link === 'ONLINE' ? 'online' : edge.link === 'OFFLINE' ? 'offline' : 'unknown',
    lastReportAt: edge.lastReportAt ?? null,
  };
}

const KINDS: Record<string, { kind: DeviceKind; description: string }> = {
  MICROPHONE: { kind: 'microphone', description: 'Reconocimiento de voz y botón de ayuda' },
  LIGHT: { kind: 'light', description: 'Encendido y apagado de la luz' },
  WINDOW: { kind: 'window_sensor', description: 'Apertura y cierre de la ventana' },
  DOOR: { kind: 'door_sensor', description: 'Apertura y cierre de la puerta' },
  CURTAIN: { kind: 'curtain', description: 'Apertura y cierre de la cortina' },
};

const STATES: Record<string, string> = {
  OPEN: 'Abierta', CLOSED: 'Cerrada', ON: 'Encendida', OFF: 'Apagada', LISTENING: 'En escucha', IDLE: 'En espera',
};

/** "habitacion-1" → "Habitación 1", "main-bedroom" → "Main bedroom": the backend only stores the room key. */
export function roomNameOf(roomKey: string): string {
  const numbered = /^habitacion-(\d+)$/.exec(roomKey);
  if (numbered) return `Habitación ${numbered[1]}`;
  const words = roomKey.replace(/[-_]+/g, ' ').trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : 'Sin habitación';
}

function stateLabelOf(device: HomeDeviceStatusResource): string {
  if (device.connectionStatus === 'UNKNOWN') return 'Aún no reporta';
  if (device.operationalStatus === 'FAILED') return 'Con falla';
  const state = device.currentState ? STATES[device.currentState.toUpperCase()] ?? device.currentState : 'Sin estado reportado';
  return device.stale ? `${state} (último estado conocido)` : state;
}

/** Maps the backend's view of the home to the entities the Devices screen shows. */
export function toHomeDevices(resource: HomeStatusResource): HomeDevices {
  const rooms = new Map<string, Room>();
  const list = resource.devices.map((device) => {
    const kind = KINDS[device.type] ?? KINDS.MICROPHONE;
    const roomName = roomNameOf(device.roomKey);
    if (!rooms.has(device.roomKey)) rooms.set(device.roomKey, { id: device.roomKey, name: roomName, description: 'Habitación del hogar' });
    return new Device({
      id: String(device.deviceId),
      code: `DEV-${String(device.deviceId).padStart(4, '0')}`,
      name: device.alias,
      description: kind.description,
      kind: kind.kind,
      roomId: device.roomKey,
      roomName,
      placement: null,
      power: device.batteryPct == null ? { type: 'wired' } : { type: 'battery', level: device.batteryPct, cell: 'Batería' },
      online: device.connectionStatus === 'CONNECTED' && device.operationalStatus !== 'FAILED',
      stateLabel: stateLabelOf(device),
      connectivity: 'Edge Alivia del hogar',
      lastSyncAt: device.lastCommunicationAt ?? device.lastUpdatedAt ?? NEVER_SYNCED,
      technicianName: 'Técnico Alivia',
      history: (device.faults ?? []).map((fault) => ({
        at: device.lastUpdatedAt ?? new Date(0).toISOString(), title: 'Falla reportada', detail: fault, tone: 'warning' as const,
      })),
    });
  });
  return {
    rooms: [...rooms.values()],
    devices: list,
    edges: (resource.edges ?? []).map(toHomeEdge),
    hubOnline: resource.edgeLink === 'ONLINE',
    hubLastContactAt: resource.lastUpdatedAt ?? NEVER_SYNCED,
  };
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
const ASSISTED_PERSONS_PATH = (import.meta.env.VITE_ASSISTED_PERSONS_ENDPOINT_PATH ?? 'assisted-persons').replace(/^\//, '');
const STATUS_PATH = (import.meta.env.VITE_HOME_DEVICE_STATUS_ENDPOINT_PATH ?? 'devices/status').replace(/^\//, '');

let usingSample = true;

/** Devices of the home of the account's assisted person, as the backend tracks them. */
const httpTrackingApi: TrackingApi = {
  get isSample() {
    return usingSample;
  },
  getHomeDevices: async () => {
    let persons: Response;
    try {
      persons = await BaseApi.request(`${API_BASE_URL}/${ASSISTED_PERSONS_PATH}`, { method: 'GET' }, { authenticated: true });
    } catch {
      usingSample = true;
      return localTrackingApi.getHomeDevices();
    }
    if (!persons.ok) throw new Error(`No se pudo leer la persona asistida (${persons.status}).`);
    const data: unknown = await persons.json();
    const person = (Array.isArray(data) ? data[0] : data) as { id?: number } | undefined;
    usingSample = false;
    if (person?.id == null) return { rooms: [], devices: [], hubOnline: false, hubLastContactAt: new Date(0).toISOString() };
    const response = await BaseApi.request(
      `${API_BASE_URL}/${ASSISTED_PERSONS_PATH}/${encodeURIComponent(person.id)}/${STATUS_PATH}`, { method: 'GET' }, { authenticated: true });
    // 404: the person has no home with an installation yet, so there is nothing installed to show.
    if (response.status === 404) return { rooms: [], devices: [], hubOnline: false, hubLastContactAt: new Date(0).toISOString() };
    if (!response.ok) throw new Error(`No se pudo leer el estado de los dispositivos (${response.status}).`);
    return toHomeDevices(await response.json() as HomeStatusResource);
  },
};

export function getTrackingApi(): TrackingApi {
  return API_BASE_URL ? httpTrackingApi : localTrackingApi;
}
