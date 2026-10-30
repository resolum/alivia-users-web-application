import { LocalCollection, respond } from '@/shared/infrastructure/local-collection.ts';
import { Device, type DeviceProps, type HomeDevices, type Room } from '../domain/model/device.entity.ts';

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

/**
 * shortcut: the telemetry contract is pending, so devices come from the
 * browser with the Figma example data. Swap in the HTTP source here.
 */
const localTrackingApi: TrackingApi = {
  isSample: true,
  getHomeDevices: async () => {
    const list = await respond(devices.all());
    return { rooms: ROOMS, devices: list.map((props) => new Device(props)) };
  },
};

export function getTrackingApi(): TrackingApi {
  return localTrackingApi;
}
