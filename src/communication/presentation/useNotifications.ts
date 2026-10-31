import { useEffect, useState } from 'react';
import { loadNotifications, subscribeToNotifications } from '../application/notifications.store.ts';
import type { CaregiverNotification } from '../domain/model/notification.entity.ts';

type Status = 'loading' | 'ready' | 'error';

/** Shared notification list; the first subscriber triggers the load. */
export function useNotifications() {
  const [items, setItems] = useState<readonly CaregiverNotification[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => subscribeToNotifications(setItems), []);

  useEffect(() => {
    let active = true;
    loadNotifications().then(
      () => active && setStatus('ready'),
      () => active && setStatus('error'),
    );
    return () => {
      active = false;
    };
  }, [attempt]);

  const retry = () => {
    setStatus('loading');
    setAttempt((count) => count + 1);
  };

  return { items, status, retry, unread: items.filter((item) => !item.read).length } as const;
}
