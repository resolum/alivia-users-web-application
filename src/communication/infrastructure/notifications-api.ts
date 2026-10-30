import { LocalCollection, respond } from '@/shared/infrastructure/local-collection.ts';
import type { CaregiverNotification } from '../domain/model/notification.entity.ts';

export interface NotificationsApi {
  readonly isSample: boolean;
  list(): Promise<CaregiverNotification[]>;
  markRead(ids: readonly string[]): Promise<void>;
}

const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

const notifications = new LocalCollection<CaregiverNotification>('alivia.communication.notifications', () => [
  {
    id: 'ntf-1', kind: 'assistance_request', title: 'Solicitud de asistencia',
    body: 'Don Alberto pidió ayuda desde el micrófono asistencial SOS.', createdAt: ago(2), read: false,
    route: '/devices?device=dev-0101', actionLabel: 'Ver solicitud',
  },
  {
    id: 'ntf-2', kind: 'low_battery', title: 'Batería baja',
    body: 'El sensor de ventana tiene 18 % de carga.', createdAt: ago(12), read: false,
    route: '/devices?device=dev-0104', actionLabel: 'Ver dispositivo',
  },
  {
    id: 'ntf-3', kind: 'upcoming_activity', title: 'Actividad próxima',
    body: 'Almuerzo nutritivo y balanceado programado para la 1:00 p. m.', createdAt: ago(30), read: false,
    route: '/activities', actionLabel: 'Ver actividad',
  },
  {
    id: 'ntf-4', kind: 'incident_update', title: 'Visita técnica programada',
    body: 'Santiago Vega revisará el sensor de ventana (INC-2026-0084).', createdAt: ago(60 * 26), read: true,
    route: '/incidents/inc-0084', actionLabel: 'Ver seguimiento',
  },
]);

/**
 * shortcut: the communications contract is pending; notifications come from
 * this browser with the Figma example data. Swap in the HTTP source here.
 */
const localNotificationsApi: NotificationsApi = {
  isSample: true,
  list: () => respond(notifications.all()),
  markRead: async (ids) => {
    notifications.replaceAll(notifications.all().map((item) => (ids.includes(item.id) ? { ...item, read: true } : item)));
    return respond(undefined);
  },
};

export function getNotificationsApi(): NotificationsApi {
  return localNotificationsApi;
}
