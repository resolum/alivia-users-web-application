import type { CaregiverNotification } from '../domain/model/notification.entity.ts';
import { getNotificationsApi } from '../infrastructure/notifications-api.ts';

type Listener = (notifications: readonly CaregiverNotification[]) => void;
const listeners = new Set<Listener>();
let current: readonly CaregiverNotification[] = [];

function publish(next: readonly CaregiverNotification[]) {
  current = next;
  listeners.forEach((listener) => listener(current));
}

/** Lets the top bar badge and the panel share one list. Returns the unsubscribe. */
export function subscribeToNotifications(listener: Listener): () => void {
  listeners.add(listener);
  listener(current);
  return () => listeners.delete(listener);
}

export const isNotificationsSample = () => getNotificationsApi().isSample;

export async function loadNotifications(): Promise<readonly CaregiverNotification[]> {
  const list = [...(await getNotificationsApi().list())].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  publish(list);
  return list;
}

export async function markNotificationsRead(ids: readonly string[]): Promise<void> {
  if (ids.length === 0) return;
  // Optimistic: the badge clears at once and the request confirms in the background.
  publish(current.map((item) => (ids.includes(item.id) ? { ...item, read: true } : item)));
  await getNotificationsApi().markRead(ids);
}
