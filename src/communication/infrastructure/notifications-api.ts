import { BaseApi } from '@/shared/infrastructure/base-api.ts';
import { LocalCollection, respond } from '@/shared/infrastructure/local-collection.ts';
import type { CaregiverNotification, NotificationKind } from '../domain/model/notification.entity.ts';

export interface NotificationsApi {
  readonly isSample: boolean;
  list(): Promise<CaregiverNotification[]>;
  markRead(ids: readonly string[]): Promise<void>;
  publish(notification: CaregiverNotification): Promise<void>;
}

interface BackendNotification {
  id: number;
  recipientUserId: number;
  type: string;
  sourceId: string;
  title: string;
  body: string;
  status: string;
  readAt: string | null;
  pushStatus: string;
  pushAttempts: number;
  createdAt: string;
}

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

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

function mapBackendTypeToKind(type: string): NotificationKind {
  switch (type) {
    case 'LOW_BATTERY':
      return 'low_battery';
    case 'HELP_REQUEST_DELAYED':
      return 'assistance_request';
    default:
      return 'incident_update';
  }
}

function mapKindToBackendType(kind: NotificationKind): string {
  switch (kind) {
    case 'low_battery':
      return 'LOW_BATTERY';
    case 'assistance_request':
      return 'HELP_REQUEST_DELAYED';
    default:
      return 'ASSIGNMENT_CREATED';
  }
}

function toCaregiverNotification(b: BackendNotification): CaregiverNotification {
  const kind = mapBackendTypeToKind(b.type);
  const route = kind === 'low_battery' || kind === 'assistance_request'
    ? (b.sourceId ? `/devices?device=${encodeURIComponent(b.sourceId)}` : '/devices')
    : '/activities';
  const actionLabel = kind === 'assistance_request'
    ? 'Ver solicitud'
    : kind === 'low_battery'
      ? 'Ver dispositivo'
      : 'Ver detalle';

  return {
    id: String(b.id),
    kind,
    title: b.title,
    body: b.body,
    createdAt: b.createdAt ?? new Date().toISOString(),
    read: b.status === 'READ',
    route,
    actionLabel,
  };
}

const localNotificationsApi: NotificationsApi = {
  isSample: true,
  list: () => respond(notifications.all()),
  markRead: async (ids) => {
    notifications.replaceAll(notifications.all().map((item) => (ids.includes(item.id) ? { ...item, read: true } : item)));
    return respond(undefined);
  },
  publish: async (notification) => {
    notifications.save(notification);
    return respond(undefined);
  },
};

const httpNotificationsApi: NotificationsApi = {
  isSample: false,
  list: async () => {
    try {
      const res = await BaseApi.request(`${BASE_URL}/notifications`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      }, { authenticated: true });
      if (!res.ok) {
        return localNotificationsApi.list();
      }
      const data: BackendNotification[] = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        return localNotificationsApi.list();
      }
      return data.map(toCaregiverNotification);
    } catch {
      return localNotificationsApi.list();
    }
  },
  markRead: async (ids) => {
    try {
      const numericIds = ids.map((id) => Number(id)).filter((id) => !Number.isNaN(id));
      if (numericIds.length > 0) {
        await BaseApi.request(`${BASE_URL}/notifications/read`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: numericIds }),
        }, { authenticated: true });
      }
    } catch {
      // fallback
    }
    await localNotificationsApi.markRead(ids);
  },
  publish: async (notification) => {
    try {
      await BaseApi.request(`${BASE_URL}/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientUserId: 1,
          type: mapKindToBackendType(notification.kind),
          sourceId: notification.id,
          title: notification.title,
          body: notification.body,
        }),
      }, { authenticated: true });
    } catch {
      // fallback
    }
    await localNotificationsApi.publish(notification);
  },
};

export function getNotificationsApi(): NotificationsApi {
  return httpNotificationsApi;
}
